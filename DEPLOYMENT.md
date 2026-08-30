# Deployment PowerChord ke Cloudflare Pages

## Konfigurasi project

PowerChord adalah static HTML site tanpa framework dan tanpa build output terpisah. Konfigurasikan Pages sebagai berikut:

| Opsi | Nilai |
|---|---|
| Production branch | `main` |
| Framework preset | None / no framework |
| Root directory | `/` |
| Build command | `npm run build` |
| Build output directory | `/` |
| Node.js version | 22 |
| Python version | 3.12 untuk tooling CI |

`npm run build` menjalankan quality check, static verifier, dan unit test. Karena source static berada di root, file HTML, CSS, JavaScript, JSON, favicon, `_headers`, dan `robots.txt` dipublikasikan dari root repository.

## Local verification

```bash
npm ci
npm run build
npm run dev
```

Kemudian buka `http://localhost:8080/` dan `http://localhost:8080/detail.html?id=komang-raim-laode`.

## Release policy

Pull request harus lulus workflow CI sebelum merge ke `main`. Deployment production hanya berasal dari `main`. Preview deployment dapat digunakan untuk memeriksa perubahan UI sebelum merge.

## Rollback

Gunakan deployment sebelumnya pada Cloudflare Pages untuk rollback jika smoke test production gagal. Sebelum rollback, simpan commit yang bermasalah dan hasil quality check untuk investigasi.

## Security headers

File `_headers` berisi hardening response untuk static site. Setiap perubahan Content Security Policy harus diuji terhadap module JavaScript, CSS, favicon, dataset JSON, dan halaman legal.

## Notes

Cloudflare Pages dapat menggunakan `exit 0` untuk static site tanpa build. Repository ini memilih `npm run build` agar deploy gagal secara deterministik ketika validasi dataset, file static, atau unit test gagal.
