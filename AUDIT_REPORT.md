# Laporan Audit Repositori `punk-kord`

**Auditor:** Manus AI  
**Tanggal audit:** 25 Agustus 2026  
**Repositori:** [pance24-web/punk-kord](https://github.com/pance24-web/punk-kord)  
**Commit yang diperiksa:** `7f550bb` — *Initial commit: ChordLagu website with transpose, autoscroll, dark mode, and 70+ songs*

## Ringkasan Eksekutif

Audit dilakukan terhadap aplikasi statis ChordLagu yang terdiri atas dua halaman HTML, satu stylesheet, satu berkas JavaScript, dan dataset JSON berisi 100 lagu. Aplikasi berhasil memuat daftar lagu dan detail lirik secara lokal, tetapi ditemukan **satu cacat fungsional kritis** pada navigasi setelah filter genre, serta beberapa masalah penting pada fitur tema gelap, ketahanan input, taksonomi data, aksesibilitas, dan maintainability.

Prioritas perbaikan pertama adalah memperbaiki pemetaan indeks lagu pada `renderSongs()`. Saat daftar difilter, fungsi tersebut menggunakan indeks array hasil filter (`idx`) sebagai `id` URL, bukan indeks lagu pada array sumber. Validasi browser membuktikan bahwa kartu pertama hasil filter Rock, yaitu “Dan...”, memiliki URL `detail.html?id=0`, sedangkan lagu tersebut berada pada indeks sumber 2. Akibatnya, pengguna dapat membuka lagu yang salah.

## Ruang Lingkup dan Metode

Audit mencakup pemeriksaan struktur repository, pembacaan seluruh kode aplikasi utama, validasi sintaks dan bentuk data JSON, pemeriksaan pola keamanan dasar, serta pengujian manual melalui server HTTP lokal. Dataset diperiksa dengan skrip deterministik untuk menghitung jumlah lagu, keunikan identitas, konsistensi struktur lirik, variasi genre, dan format kunci.

| Area | Hasil pemeriksaan |
|---|---|
| Struktur | 2 halaman HTML, 1 JS, 1 CSS, 1 dataset JSON, 1 `package.json` |
| Dataset | JSON valid; 100 lagu; seluruh objek memiliki struktur lirik yang valid |
| Runtime | Daftar lagu berhasil dimuat melalui HTTP lokal |
| Interaksi | Filter genre berjalan; navigasi hasil filter salah pada kasus tertentu |
| Tema | Atribut tema berubah, tetapi stylesheet tidak memiliki aturan dark mode dan listener tombol tidak terpasang pada waktu inisialisasi |
| Pengujian otomatis | Tidak tersedia; `package.json` hanya memiliki script `dev` dan `start` |

## Temuan Terprioritaskan

### AUD-001 — Navigasi hasil filter membuka lagu yang salah

**Keparahan: Kritis untuk fungsi inti**  
**Lokasi:** `js/main.js:68–71`

`renderSongs(data)` melakukan iterasi terhadap array hasil filter dan membangun tautan dengan `detail.html?id=${idx}`. Nilai `idx` adalah indeks relatif terhadap array hasil filter, bukan indeks asli pada `lagu`. Detail page kemudian membaca `lagu[songId]`, sehingga ID tersebut merujuk ke lagu berbeda.

Validasi langsung menunjukkan hasil berikut:

| Kondisi | Nilai |
|---|---|
| Filter aktif | Rock |
| Judul kartu pertama | Dan... |
| URL yang dibuat | `detail.html?id=0` |
| Indeks sebenarnya di `songs.json` | `2` |
| Dampak | Membuka lagu pada indeks 0, yaitu “Komang”, bukan “Dan...” |

**Rekomendasi:** Pertahankan indeks sumber bersama objek lagu, atau cari kembali indeks sumber berdasarkan identitas yang stabil. Pola minimal yang aman adalah memfilter pasangan `{ song, originalIndex }`, lalu membuat URL memakai `originalIndex`. Hindari mengandalkan judul saja karena judul dapat berduplikasi di masa depan.

### AUD-002 — Fitur dark mode tidak mengubah warna tampilan

**Keparahan: Tinggi**  
**Lokasi:** `index.html:8–15`, `detail.html:8–15`, `js/main.js:7–36`, `css/style.css:7–11`

Script mengatur atribut `data-theme` menjadi `dark`, dan pengujian DOM mengonfirmasi atribut tersebut berubah setelah tombol ditekan. Namun, stylesheet tidak memiliki selector `data-theme` atau aturan warna gelap. Warna latar tetap `rgb(248, 249, 250)`, sehingga fitur hanya mengubah metadata DOM tanpa perubahan visual yang bermakna.

Selain itu, `initThemeToggle()` dieksekusi di bagian awal `main.js`, sebelum elemen `<button id="themeToggle">` dibuat oleh parser HTML. Karena `document.getElementById('themeToggle')` menghasilkan `null`, listener klik tidak dipasang pada eksekusi normal. Inisialisasi tema awal tetap dapat mengatur atribut, tetapi tombol tidak dapat diandalkan untuk mengganti tema.

**Rekomendasi:** Pindahkan inisialisasi listener ke `DOMContentLoaded`, atau letakkan script setelah markup tombol. Tambahkan token warna CSS dan selector `[data-theme="dark"]`. Akses `localStorage` juga perlu dibungkus `try/catch` pada inline script di kedua halaman agar kegagalan storage dalam mode privat tidak menghentikan pemuatan halaman.

### AUD-003 — `innerHTML` menggunakan data dataset tanpa escaping

**Keparahan: Sedang**  
**Lokasi:** `js/main.js:73–76` dan `js/main.js:135–140`

Judul dan artis dimasukkan melalui template literal ke `innerHTML`. Dataset saat ini adalah file lokal yang dikomit ke repository, sehingga risiko langsung terbatas. Namun, setiap perubahan sumber data yang memasukkan karakter HTML atau skrip dapat menyebabkan markup tidak diharapkan atau XSS ketika file JSON disajikan dari sumber yang tidak sepenuhnya tepercaya.

**Rekomendasi:** Buat elemen dan isi teks menggunakan `textContent`, khususnya untuk `song.judul` dan `song.artis`. Untuk autocomplete, hindari membangun anchor melalui `innerHTML`; gunakan `createElement`, set `textContent`, dan set `href` secara eksplisit.

### AUD-004 — Taksonomi genre tidak sepenuhnya selaras dengan filter yang tersedia

**Keparahan: Sedang**  
**Lokasi:** `index.html:40–50`, `js/main.js:86–100`, `data/songs.json`

Dataset memiliki genre `Slow Rock`, `Indie Folk`, `Indie Rock`, `Indie Retro`, dan `Folk Rock`, tetapi tidak ada chip yang mewakili `Slow Rock`. Filter `Rock` menggunakan exact match, sehingga lagu `Slow Rock`, `Indie Rock`, dan `Folk Rock` tidak muncul pada filter Rock. Filter `Folk` dan `Indie` menggunakan pencocokan substring dan karena itu memiliki perilaku berbeda dari kategori lain.

**Rekomendasi:** Tentukan kontrak taksonomi secara eksplisit: gunakan kategori utama terpisah dari subgenre, atau gunakan normalisasi berbasis tag array. Jika tujuan pengguna adalah kategori payung, gunakan aturan konsisten seperti `genre.includes('Rock')`; jika tujuan pengguna adalah exact genre, sediakan chip untuk seluruh nilai genre yang ada.

### AUD-005 — Aksesibilitas keyboard dan label form belum memadai

**Keparahan: Sedang**  
**Lokasi:** `index.html:30–34`, `css/style.css`

Input pencarian hanya memiliki placeholder dan tidak memiliki `<label>` yang terhubung. Stylesheet hanya menyediakan `:focus` untuk input pencarian; tidak terdapat aturan `:focus-visible` untuk link dan tombol. Pengguna keyboard dapat kehilangan indikator fokus, terutama pada tombol filter, tombol tema, dan kartu lagu.

**Rekomendasi:** Tambahkan label yang terhubung dengan `for="searchInput"`, pertahankan indikator fokus dengan kontras memadai, dan tambahkan `:focus-visible` untuk seluruh kontrol interaktif. Pertimbangkan atribut ARIA untuk region hasil pencarian, misalnya `role="status"` atau mekanisme live region yang tidak mengganggu pembaca layar.

### AUD-006 — Tidak ada pengujian otomatis atau quality gate

**Keparahan: Sedang untuk maintainability**  
**Lokasi:** `package.json:6–9`

`package.json` hanya menyediakan script `dev` dan `start`, keduanya menjalankan server Python. Tidak ada linting, unit test, validasi dataset, test smoke untuk navigasi, atau CI. Bug AUD-001 dapat terdeteksi oleh satu test sederhana yang memfilter data lalu memverifikasi bahwa setiap href menunjuk ke judul yang sama.

**Rekomendasi:** Tambahkan skrip validasi JSON, lint JavaScript, dan test browser minimal untuk pemuatan daftar, filter, pencarian, navigasi detail, transpose, serta tema. Jalankan quality gate pada setiap pull request.

### AUD-007 — Autoscroll berpotensi menumpuk animasi scroll

**Keparahan: Rendah–Sedang**  
**Lokasi:** `js/main.js:274–286`

Autoscroll memanggil `window.scrollBy({ behavior: 'smooth' })` setiap 50 ms. Animasi smooth yang dipanggil berulang dapat menumpuk atau menghasilkan gerakan yang tidak konsisten di browser tertentu. Mekanisme penghentian hanya memeriksa posisi halaman pada interval yang sama.

**Rekomendasi:** Gunakan `requestAnimationFrame` dengan perhitungan waktu atau gunakan `window.scrollBy` tanpa smooth dalam loop terkontrol. Hormati `prefers-reduced-motion` dan hentikan timer ketika halaman tidak terlihat.

## Temuan Positif

Dataset JSON valid dan berisi 100 objek lagu dengan struktur yang konsisten. Seluruh objek memiliki `lirik` berupa array, dan seluruh baris yang diperiksa memiliki field string `chord` serta `teks`. Render lirik pada halaman detail menggunakan `textContent`, sehingga bagian tersebut memiliki perlindungan lebih baik terhadap injeksi markup dibandingkan render kartu dan autocomplete. Pemuatan data menggunakan `response.ok` sebelum parsing, dan UI menyediakan pesan kegagalan dasar jika dataset tidak dapat dimuat.

## Rencana Perbaikan yang Disarankan

| Urutan | Tindakan | Tujuan |
|---:|---|---|
| 1 | Perbaiki pemetaan indeks sumber pada kartu hasil filter | Menghilangkan navigasi ke lagu yang salah |
| 2 | Pindahkan pemasangan listener tema setelah DOM tersedia | Membuat tombol tema berfungsi konsisten |
| 3 | Implementasikan CSS dark mode dan fallback storage | Menjadikan fitur tema benar-benar terlihat dan tahan error |
| 4 | Ganti render berbasis `innerHTML` dengan DOM API dan `textContent` | Mengurangi risiko injeksi dan memperjelas kontrak UI |
| 5 | Normalisasi taksonomi genre | Membuat filter dapat diprediksi dan lengkap |
| 6 | Tambahkan label, focus ring, dan smoke test | Meningkatkan aksesibilitas dan mencegah regresi |
| 7 | Refaktor autoscroll | Meningkatkan kelancaran dan efisiensi runtime |

## Kesimpulan

Repositori berada pada kondisi **dapat dijalankan sebagai prototipe**, tetapi belum siap dianggap stabil untuk penggunaan publik tanpa perbaikan AUD-001 dan AUD-002. Cacat navigasi filter memengaruhi keandalan fungsi utama, sedangkan dark mode yang tidak lengkap menyebabkan fitur yang dinyatakan dalam commit belum terpenuhi secara visual maupun interaktif. Setelah dua masalah tersebut diperbaiki, penguatan aksesibilitas, keamanan render, normalisasi genre, serta pengujian otomatis sebaiknya dilakukan sebelum pengembangan fitur lanjutan.

## Referensi

[1]: https://github.com/pance24-web/punk-kord "Repositori GitHub pance24-web/punk-kord"
[2]: https://developer.mozilla.org/en-US/docs/Web/API/Document/getElementById "MDN: Document.getElementById"
[3]: https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent "MDN: Node.textContent"
[4]: https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible "MDN: :focus-visible"
[5]: https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame "MDN: requestAnimationFrame"


## Status Setelah Perbaikan

Seluruh temuan teknis dalam audit awal telah ditindaklanjuti pada working tree saat ini. AUD-001 diperbaiki dengan mempertahankan indeks sumber lagu. AUD-002 diperbaiki dengan listener tema yang aktif setelah markup tersedia, CSS dark mode, dan fallback storage. AUD-003 diperbaiki dengan DOM API serta `textContent`. AUD-004 diperbaiki melalui matcher genre yang konsisten dan mencakup subgenre Rock/Folk/Indie. AUD-005 diperbaiki dengan label pencarian, atribut ARIA, indikator fokus, serta dukungan keyboard Escape. AUD-006 ditindaklanjuti dengan `npm run check` dan validator dataset. AUD-007 diperbaiki dengan `requestAnimationFrame` dan dukungan `prefers-reduced-motion`.

Validasi akhir menunjukkan pemeriksaan sintaks JavaScript lulus, dataset 100 lagu tervalidasi, `git diff --check` lulus, filter Rock menghasilkan 51 lagu dengan semua href mengarah ke indeks sumber yang benar, autocomplete tetap terlihat tanpa membentuk node markup berbahaya, detail ID tidak valid menghasilkan pesan “Lagu tidak ditemukan”, dan transpose berhasil menggeser seluruh kunci pada format multi-kunci seperti `Dm, Em`.
