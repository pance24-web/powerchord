# Deployment PowerChord ke Cloudflare Pages

## Konfigurasi project

PowerChord adalah static HTML site tanpa framework dan tanpa build output terpisah. Konfigurasikan Pages sebagai berikut:

| Opsi | Nilai |
|---|---|
| Production branch | `main` |
| Framework preset | None / no framework |
| Root directory | `/` |
| Build command | `npm run build` |
| Build output directory | `public` |
| Node.js version | 22 |
| Python version | 3.12 untuk tooling CI |

`wrangler.toml` menetapkan `public/` sebagai direktori output Cloudflare Pages secara eksplisit. `npm run build` menyiapkan asset runtime ke `public/`, menjalankan quality check, static verifier, dan unit test. Source canonical dataset tetap berada di `data/songs.json`, sedangkan Cloudflare Pages mempublikasikan hasil build dari `public/`, termasuk HTML, CSS, JavaScript, JSON, favicon, `_headers`, dan `robots.txt`.

## Read-only API

Cloudflare Pages Functions menyediakan endpoint read-only berikut:

| Method | Endpoint | Keterangan |
|---|---|---|
| `GET` | `/api/songs` | Daftar lagu published dengan `q`, `genre`, `limit`, dan `offset` |
| `GET` | `/api/songs/:id` | Detail lagu berdasarkan slug; legacy ID numerik didukung jika tersedia |
| `GET` | `/api/favorites` | Mengambil favorit milik pengguna yang sedang login |
| `POST` | `/api/favorites` | Menyimpan `{ "song_id": "..." }` untuk pengguna yang sedang login |
| `DELETE` | `/api/favorites` | Menghapus `{ "song_id": "..." }` dari favorit pengguna |

Response sukses menggunakan `{ "data": ... }`. Daftar lagu menambahkan `{ "meta": { "total", "limit", "offset" } }`. Error menggunakan `{ "error": { "code", "message" } }` dan status HTTP `400`, `404`, atau `503`. Functions membaca `public/data/songs.json` melalui binding `ASSETS`, sehingga API tetap menggunakan dataset lokal yang tervalidasi dan tidak bergantung pada Supabase untuk read-only MVP.

### Auth dan RLS

Endpoint favorites membutuhkan header `Authorization: Bearer <supabase-access-token>`. Function memvalidasi token melalui Supabase Auth, meneruskan token pengguna ke REST API, dan mengambil `user_id` dari identitas token—bukan dari input client. Jalankan `database/migrations/20260914_user_favorites.sql` pada Supabase sebelum mengaktifkan endpoint ini. RLS membatasi `SELECT`, `INSERT`, dan `DELETE` hanya pada baris dengan `auth.uid() = user_id`; tidak ada policy mutation untuk role anonim.

## Local verification

```bash
npm ci
npm run build
npm run dev
```

Kemudian buka `http://localhost:8080/` dan `http://localhost:8080/detail.html?id=komang-raim-laode`.

## Supabase RLS integration test

Repository menyediakan test read-only yang memanggil REST API Supabase menggunakan publishable/anon key. Test ini memastikan endpoint publik `songs` tidak mengembalikan baris selain `published`, filter status unpublished menghasilkan array kosong, dan endpoint `artists` tetap dapat dibaca untuk kebutuhan katalog.

Jalankan dengan environment variable yang tidak disimpan di repository:

```bash
SUPABASE_URL="https://your-project.supabase.co" \
SUPABASE_PUBLISHABLE_KEY="your-anon-or-publishable-key" \
npm run test:rls
```

Test tidak melakukan `INSERT`, `UPDATE`, atau `DELETE`. Jika environment variable belum tersedia, test dilewati dengan pesan yang jelas sehingga `npm test` lokal tetap dapat berjalan tanpa koneksi database. Pada CI, simpan kedua nilai tersebut sebagai encrypted secrets dan jadikan `npm run test:rls` sebagai job terpisah dari unit test lokal.

## Release policy

Pull request harus lulus workflow CI sebelum merge ke `main`. Deployment production hanya berasal dari `main`. Preview deployment dapat digunakan untuk memeriksa perubahan UI sebelum merge.

## Rollback

Gunakan deployment sebelumnya pada Cloudflare Pages untuk rollback jika smoke test production gagal. Sebelum rollback, simpan commit yang bermasalah dan hasil quality check untuk investigasi.

## Security headers

File `_headers` berisi hardening response untuk static site. Setiap perubahan Content Security Policy harus diuji terhadap module JavaScript, CSS, favicon, dataset JSON, dan halaman legal.

## Notes

Cloudflare Pages dapat menggunakan `exit 0` untuk static site tanpa build. Repository ini memilih `npm run build` agar deploy gagal secara deterministik ketika validasi dataset, file static, atau unit test gagal.
