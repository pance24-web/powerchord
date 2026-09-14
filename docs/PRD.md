# Product Requirements Document

## PowerChord

**Status:** Draft untuk review produk dan teknis
**Versi:** 0.1
**Tanggal:** 14 September 2026
**Pemilik produk:** pance24-web
**Basis arsitektur:** PowerChord sebagai frontend utama dengan API/service layer bertahap

---

## 1. Ringkasan Eksekutif

PowerChord adalah aplikasi web untuk membantu gitaris mencari lagu, membaca lirik dan chord, mempelajari bentuk chord, melakukan transpose, serta berlatih menggunakan fitur pendukung seperti rekomendasi capo dan auto-scroll.

Produk akan menggunakan **PowerChord sebagai basis utama** karena repository tersebut sudah memiliki katalog, fitur gitar, PWA, SEO, validasi dataset, security headers, dan quality checks yang lebih matang. Pola backend dari ChordPlayer akan diadopsi secara bertahap ketika produk membutuhkan data dinamis, autentikasi, favorit, kontribusi lagu, atau panel admin.

Target fase pertama adalah menghasilkan katalog publik yang cepat, dapat dipercaya, mudah digunakan pada perangkat mobile, dan dapat dikembangkan tanpa migrasi arsitektur besar di masa depan.

> **Keputusan arsitektur:** mulai dari static-first, siapkan kontrak API sejak awal, gunakan Supabase sebagai kandidat database utama ketika persistence dibutuhkan, dan pertahankan fallback dataset lokal untuk ketahanan layanan.

## 2. Masalah yang Ingin Diselesaikan

Gitaris sering menemukan chord dan lirik dari sumber yang tidak konsisten, sulit dibaca pada layar kecil, atau tidak menyediakan alat bantu untuk menyesuaikan lagu dengan kemampuan bermain mereka. Informasi chord juga sering tersebar di banyak halaman sehingga pengguna harus berpindah-pindah sumber ketika berlatih.

PowerChord menyelesaikan masalah tersebut dengan menyediakan satu tempat untuk menemukan lagu, membaca chord dan lirik dalam format yang rapi, mengubah nada, memeriksa diagram chord, dan mengikuti lagu saat bermain.

## 3. Tujuan Produk

| Tujuan | Indikator keberhasilan fase pertama |
| --- | --- |
| Memudahkan pengguna menemukan lagu | Pengguna dapat menemukan lagu berdasarkan judul atau artis dari halaman utama |
| Memudahkan pengguna memainkan lagu | Halaman detail menampilkan chord, lirik, key, tingkat kesulitan, dan diagram chord dengan jelas |
| Mendukung latihan gitar | Transpose, capo suggestion, auto-scroll, dan mode baca dapat digunakan pada desktop serta mobile |
| Menyediakan katalog publik yang stabil | Build, validasi data, static check, dan unit test lulus sebelum deployment |
| Menyiapkan evolusi full-stack | Kontrak data dan API tidak bergantung langsung pada implementasi storage tertentu |

## 4. Non-Tujuan

Hal-hal berikut tidak menjadi target fase pertama:

- Autentikasi pengguna.

- Sinkronisasi favorit lintas perangkat.

- Panel admin lengkap.

- Kontribusi lagu oleh pengguna secara publik.

- Audio streaming atau pengenalan chord dari audio.

- Marketplace, pembayaran, atau fitur berlangganan.

- Aplikasi native iOS dan Android.

- Migrasi penuh ke backend Express sebelum kebutuhan persistence terbukti.

Non-tujuan ini dapat masuk roadmap setelah kebutuhan, risiko moderasi, dan biaya operasionalnya jelas.

## 5. Pengguna Sasaran

### 5.1 Gitaris pemula

Gitaris pemula membutuhkan pencarian lagu yang sederhana, diagram chord yang mudah dipahami, penjelasan tingkat kesulitan, serta rekomendasi capo ketika lagu terlalu sulit dimainkan pada key asli.

### 5.2 Gitaris yang sedang berlatih

Pengguna ini membutuhkan tampilan lirik yang stabil, transpose, auto-scroll, mode layar penuh, dan akses cepat ke lagu yang baru dibuka.

### 5.3 Pengguna kasual

Pengguna kasual ingin menemukan lagu berdasarkan judul atau artis dan langsung membaca chord tanpa proses instalasi atau pembuatan akun.

### 5.4 Pengelola katalog

Pengelola katalog membutuhkan format data yang tervalidasi, status publikasi, mekanisme seed atau import, dan pemeriksaan otomatis sebelum data dirilis.

## 6. Prinsip Produk

1. **Mobile-first.** Fitur utama harus nyaman digunakan pada layar kecil.

2. **Cepat sebelum kompleks.** Katalog publik tetap dapat berjalan tanpa login dan tanpa runtime backend pada fase pertama.

3. **Data konsisten.** Semua sumber data harus menghasilkan kontrak lagu yang sama.

4. **Alat bantu harus dapat dijelaskan.** Rekomendasi transpose, capo, dan difficulty harus deterministik serta dapat diuji.

5. **Graceful degradation.** Kegagalan database atau jaringan tidak boleh membuat seluruh pengalaman membaca lagu rusak jika fallback tersedia.

6. **Akses publik yang bertanggung jawab.** Konten dan halaman legal harus tersedia sebelum skala distribusi diperluas.

## 7. Ruang Lingkup MVP

MVP terdiri dari katalog publik dan reader lagu yang dapat digunakan tanpa akun.

| Area | Kebutuhan MVP |
| --- | --- |
| Home | Pencarian lagu berdasarkan judul dan artis, daftar lagu pilihan, dan navigasi ke katalog |
| Catalog | Daftar lagu, filter genre, dan hasil pencarian yang deterministik |
| Detail lagu | Judul, artis, key, capo, difficulty, chord, lirik, dan URL yang stabil |
| Chord tools | Transpose, parsing slash chord, bentuk major/minor/barre, dan diagram interaktif |
| Practice tools | Auto-scroll, kontrol kecepatan, mode baca atau fullscreen, dan kontrol yang dapat digunakan keyboard |
| PWA | Manifest, service worker, installability dasar, dan cache asset statis yang aman |
| SEO | Metadata halaman, sitemap, robots.txt, URL detail stabil, dan halaman legal dasar |
| Reliability | Fallback dataset lokal dan pesan error yang jelas ketika data remote gagal |
| Quality | Lint, validasi dataset, static verification, unit test, dan build yang deterministik |

## 8. Kebutuhan Fungsional

### FR-01 — Pencarian lagu

Pengguna harus dapat memasukkan kata kunci judul atau artis. Sistem harus menormalisasi spasi dan huruf besar-kecil. Hasil harus memiliki urutan yang konsisten dengan prioritas judul sama persis, kecocokan judul, kecocokan artis, lalu kecocokan sebagian.

**Kriteria penerimaan:**

- Pencarian tanpa kata kunci menampilkan state katalog yang sesuai.

- Spasi berlebih tidak mengubah hasil secara tidak semestinya.

- Hasil tidak menampilkan lagu duplikat.

- Empty state memberi saran untuk mengubah kata kunci.

### FR-02 — Katalog dan filter

Pengguna harus dapat melihat daftar lagu dan memfilter berdasarkan genre jika metadata genre tersedia.

**Kriteria penerimaan:**

- Filter genre hanya menampilkan lagu dari genre yang dipilih.

- Genre yang tidak memiliki lagu menghasilkan empty state.

- Pengguna dapat menghapus filter tanpa memuat ulang halaman.

### FR-03 — Detail lagu

Pengguna harus dapat membuka detail menggunakan slug publik. Sistem harus mendukung kompatibilitas link numerik lama jika migrasi dari ChordPlayer diperlukan.

**Kriteria penerimaan:**

- Slug valid membuka lagu yang benar.

- Lagu yang tidak ditemukan menampilkan halaman 404 yang informatif.

- Data detail memiliki struktur yang sama dari JSON, Supabase, maupun API.

### FR-04 — Transpose

Pengguna harus dapat menaikkan atau menurunkan key lagu. Sistem harus mempertahankan kualitas chord, slash chord, minor chord, dan simbol umum lainnya.

**Kriteria penerimaan:**

- Transpose chord mayor, minor, seventh, dan slash chord diuji.

- Nilai transpose dapat dikembalikan ke nol.

- Key tampilan ikut diperbarui.

- Perubahan tidak mengubah teks lirik non-chord.

### FR-05 — Diagram chord

Sistem harus menampilkan bentuk chord yang diketahui dan memberikan fallback visual yang aman untuk chord yang belum didukung.

**Kriteria penerimaan:**

- Major, minor, dan barre chord utama memiliki posisi yang benar.

- Chord tidak valid tidak menyebabkan halaman gagal dirender.

- Diagram memiliki label yang dapat dibaca screen reader.

### FR-06 — Capo dan difficulty

Sistem harus menghitung tingkat kesulitan berdasarkan aturan yang terdokumentasi dan dapat memberikan rekomendasi capo untuk lagu yang terlalu banyak menggunakan barre chord.

**Kriteria penerimaan:**

- Lagu mudah tidak dipaksa menggunakan capo.

- Lagu barre-heavy dapat memperoleh rekomendasi fret yang masuk akal.

- Hasil rekomendasi deterministik dan memiliki unit test.

### FR-07 — Mode latihan

Pengguna harus dapat mengaktifkan auto-scroll, mengatur kecepatan, menghentikan scroll, dan keluar dari mode fullscreen.

**Kriteria penerimaan:**

- Kontrol dapat diakses melalui keyboard.

- Tombol menggunakan state yang terlihat dan atribut aksesibilitas yang sesuai.

- Refresh halaman tidak membuat timer scroll ganda.

### FR-08 — Ketahanan data

Jika API atau database tidak tersedia, sistem harus menggunakan fallback dataset lokal yang tervalidasi.

**Kriteria penerimaan:**

- Kegagalan remote tidak menghasilkan halaman kosong tanpa penjelasan.

- Fallback tidak digunakan secara diam-diam ketika response remote memiliki format rusak.

- Error dicatat untuk debugging tanpa membocorkan credential.

## 9. Kontrak Data Kanonik

Frontend harus menggunakan format kanonik berikut, terlepas dari sumber penyimpanannya:

```json
{
  "id": "komang-raim-laode",
  "legacy_id": 1,
  "title": "Komang",
  "artist": "Raim Laode",
  "genre": "Pop",
  "key": "C",
  "capo": 0,
  "lyrics": [
    {
      "chord": "C",
      "text": "Contoh baris lirik"
    }
  ],
  "status": "published",
  "updated_at": "2026-09-14T00:00:00Z"
}
```

Field `id` adalah slug publik utama. Field `legacy_id` bersifat opsional dan hanya digunakan untuk kompatibilitas migrasi. Field `status` diperlukan ketika data mulai disimpan di Supabase atau database lain.

Normalisasi nama field dilakukan di service layer. Frontend tidak boleh memiliki logika khusus untuk membedakan `judul` dari `title` atau `artis` dari `artist`.

## 10. Kontrak API Masa Depan

API belum menjadi dependensi wajib pada MVP static-first. Namun, endpoint berikut harus disiapkan sebagai kontrak evolusi:

| Method | Endpoint | Tujuan |
| --- | --- | --- |
| `GET` | `/api/songs` | Mengambil daftar lagu terbit |
| `GET` | `/api/songs/:id` | Mengambil detail berdasarkan slug atau legacy ID |
| `GET` | `/api/genres` | Mengambil daftar genre |
| `POST` | `/api/favorites` | Menyimpan favorit setelah autentikasi tersedia |
| `GET` | `/api/favorites` | Mengambil favorit pengguna |
| `POST` | `/api/songs` | Mengusulkan lagu baru melalui workflow moderasi |
| `PATCH` | `/api/songs/:id` | Mengubah lagu untuk admin atau editor |

Response sukses dan error harus menggunakan JSON. Error minimal memiliki `code`, `message`, dan `request_id` jika observability sudah tersedia.

## 11. Arsitektur Teknis Target

### Fase static-first

```
Browser → Cloudflare Pages → public/ → data/songs.json
```

Fase ini memaksimalkan kecepatan, biaya rendah, dan kemudahan deployment.

### Fase API-enabled

```
Browser → Cloudflare Pages → API/service layer → Supabase
                                      └──────→ fallback dataset lokal
```

Service layer bertanggung jawab atas validasi input, normalisasi data, query, error handling, dan fallback. Frontend hanya berinteraksi dengan kontrak data kanonik.

### Fase user features

```
Browser → API → Supabase Auth + database + RLS
```

Fitur privat seperti favorit harus dikontrol melalui autentikasi dan Row Level Security. Frontend tidak boleh mengandalkan penyembunyian tombol sebagai mekanisme authorization.

## 12. Kebutuhan Non-Fungsional

| Kategori | Target |
| --- | --- |
| Performance | Halaman utama dapat digunakan tanpa menunggu database remote |
| Availability | Reader tetap dapat membaca data fallback ketika remote unavailable |
| Accessibility | Navigasi keyboard, focus state, label kontrol, dan kontras yang layak |
| Security | Security headers, tidak ada credential di client bundle, validasi input, dan RLS untuk data privat |
| Compatibility | Browser modern pada desktop dan mobile |
| Maintainability | Modul core, service, dan validator memiliki tanggung jawab terpisah |
| Observability | Error API dan fallback dapat ditelusuri tanpa mencatat data sensitif |
| Data quality | Dataset memiliki ID unik, field wajib, format chord valid, dan status publikasi jelas |

## 13. Strategi Testing

Testing dibagi menjadi empat lapisan:

1. **Unit test core.** Menguji search, ranking, transpose, chord shape, difficulty, dan capo.

2. **Unit test service/API.** Menguji validasi ID, response 200, 400, 404, error database, dan fallback.

3. **Data validation.** Menguji schema, ID unik, field wajib, dan status publikasi.

4. **Static/build verification.** Menguji keberadaan route, asset, security headers, manifest, sitemap, dan hasil build.

Build production tidak boleh berhasil jika lint, validasi data, static verification, atau test wajib gagal. Test integrasi Supabase dapat dijalankan sebagai job terpisah ketika credential tersedia.

## 14. Roadmap

### Milestone 1 — Konsolidasi kontrak data

Targetnya adalah menyatukan field `title`, `artist`, `lyrics`, `key`, `genre`, `status`, serta format ID. Dataset PowerChord menjadi sumber kanonik dan validator menjadi gate perubahan data.

### Milestone 2 — Modularisasi frontend

Logika search, transpose, chord diagram, capo, dan practice mode dipisahkan dari kode halaman. Setiap modul memiliki test yang dapat dijalankan tanpa browser.

### Milestone 3 — API read-only

Tambahkan `GET /api/songs` dan `GET /api/songs/:id`. Frontend menggunakan API dengan fallback dataset lokal. Database dapat menggunakan Supabase sebagai sumber utama.

### Milestone 4 — User features terbatas

Tambahkan autentikasi, favorit pribadi, history lintas perangkat, serta RLS. Fitur ini dirilis setelah kontrak API dan security test stabil.

### Milestone 5 — Moderated contribution

Tambahkan submission lagu, status `draft`, `review`, `published`, serta panel editor. Tidak ada konten pengguna yang dipublikasikan langsung tanpa validasi dan moderasi.

## 15. Risiko dan Mitigasi

| Risiko | Dampak | Mitigasi |
| --- | --- | --- |
| Format data dua repo tidak sama | Tinggi | Tetapkan canonical schema dan normalisasi hanya di service layer |
| API dan frontend berbeda domain | Sedang | Konfigurasi CORS, API base URL, dan smoke test deployment |
| Data fallback tidak mutakhir | Sedang | Tambahkan timestamp dataset dan proses regenerasi fallback saat build |
| Cache PWA menyimpan data lama | Sedang | Versioned cache dan strategi network-first untuk data dinamis |
| Credential Supabase masuk bundle | Tinggi | Gunakan hanya publishable key di client dan secret di server/CI |
| Konten lagu bermasalah secara legal | Tinggi | Sediakan halaman legal, proses takedown, status publikasi, dan audit sumber data |
| Scope melebar ke auth terlalu cepat | Sedang | Tahan fitur user sampai MVP katalog memenuhi acceptance criteria |

## 16. Definition of Done MVP

MVP dianggap selesai apabila semua kondisi berikut terpenuhi:

- Pengguna dapat mencari dan membuka lagu dari desktop serta mobile.

- Detail lagu menampilkan chord dan lirik tanpa error pada data valid.

- Transpose, diagram chord, capo suggestion, dan auto-scroll memiliki test yang lulus.

- Lagu tidak ditemukan dan pencarian kosong memiliki state yang jelas.

- Dataset lolos validator dan tidak memiliki ID duplikat.

- Build production lulus lint, static verification, dan unit test.

- Fallback dapat digunakan ketika sumber data remote tidak tersedia.

- Security headers dan halaman legal dasar terpasang.

- Tidak ada credential privat yang tersimpan di repository atau client bundle.

- Dokumentasi deployment dan format data tersedia.

## 17. Keputusan yang Masih Terbuka

| Keputusan | Default yang disarankan | Pengambil keputusan |
| --- | --- | --- |
| Database fase API | Supabase | Pemilik produk dan teknis |
| Hosting API | Cloudflare Worker, Vercel Function, atau runtime Express terpisah | Pemilik teknis |
| Sumber data utama | Supabase setelah API read-only stabil | Pemilik produk |
| Kebijakan konten | Curated catalog sebelum user contribution | Pemilik produk |
| Format URL | Slug publik dengan dukungan legacy ID | Pemilik produk |
| Login | Ditunda setelah kebutuhan favorit tervalidasi | Pemilik produk |

## 18. Referensi Repository

Dokumen ini menggunakan kondisi repository pada saat penyusunan sebagai input arsitektur dan product scope.

[1]: https://github.com/pance24-web/powerchord "PowerChord repository"

[2]: https://github.com/pance24-web/ChordPlayer "ChordPlayer repository"