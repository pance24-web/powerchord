Saya akan mengecek repository GitHub Anda terlebih dahulu untuk memahami struktur dan fitur yang ada, kemudian membuatkan PRD (Product Requirements Document).


Saya perlu melihat lebih detail tentang repo ini. Mari saya cek file-file penting dan struktur kodenya.


Berdasarkan analisis mendalam terhadap repository **punk-kord**, berikut adalah **Product Requirements Document (PRD)** yang komprehensif untuk aplikasi ini.

---

# Product Requirements Document (PRD): Punk Kord

| Informasi Dokumen | Detail |
| :--- | :--- |
| **Nama Produk** | Punk Kord |
| **Versi** | 1.0 (Stable) |
| **Tanggal** | 26 Agustus 2026 |
| **Status** | Live / Maintenance |
| **Repository** | `https://github.com/pance24-web/punk-kord` |

## 1. Ringkasan Eksekutif
**Punk Kord** adalah aplikasi web statis berbasis client-side yang menyediakan database kunci gitar dan lirik lagu Indonesia. Aplikasi ini dirancang untuk musisi pemula hingga mahir dengan fitur interaktif seperti transposisi kunci otomatis, mode autoscroll untuk membaca lirik saat bermain, serta dukungan tema gelap/terang. Dengan arsitektur ringan (HTML, CSS, JS Vanilla), aplikasi ini menawarkan performa tinggi tanpa ketergantungan pada backend server yang kompleks.

## 2. Tujuan & Visi Produk
*   **Visi:** Menjadi platform referensi utama bagi pemain gitar di Indonesia untuk mengakses chord dan lirik secara cepat, akurat, dan mudah digunakan.
*   **Tujuan:**
    *   Menyediakan akses offline-friendly melalui static hosting.
    *   Memudahkan pengguna menyesuaikan nada lagu sesuai vokal mereka melalui fitur transpose.
    *   Meningkatkan pengalaman belajar musik dengan fitur autoscroll yang stabil.

## 3. Target Pengguna (User Persona)
1.  **Pemula Gitaris:** Mencari chord dasar untuk lagu-lagu populer Indonesia.
2.  **Penyanyi Akustik:** Membutuhkan fitur transpose untuk menyesuaikan nada dengan range vokal mereka saat manggung atau latihan.
3.  **Penggemar Musik:** Ingin menyanyikan lagu favorit sambil melihat lirik yang tersinkronisasi.

## 4. Fitur Utama (Functional Requirements)

### 4.1 Halaman Beranda (Index)
*   **Pencarian Real-time:** Input pencarian yang memfilter lagu berdasarkan Judul atau Artis secara instan (minimal 2 karakter).
*   **Filter Genre:** Chip kategori genre (Pop, Rock, Dangdut, Indie, Minang, dll) untuk mempersempit hasil pencarian.
*   **Daftar Lagu (Song List):** Menampilkan kartu lagu berisi Judul dan Nama Artis. Klik pada kartu akan mengarahkan ke halaman detail.
*   **Autocomplete Search:** Dropdown saran lagu muncul saat pengguna mengetik di kolom pencarian.

### 4.2 Halaman Detail Lagu
*   **Display Lirik & Chord:** Menampilkan lirik berbaris dengan chord yang diletakkan tepat di atas suku kata/kata yang sesuai.
*   **Fitur Transpose (Ubah Nada):**
    *   Tombol `+` dan `-` untuk menaikkan atau menurunkan nada sebesar 1 semitone.
    *   Tombol `Reset` untuk mengembalikan ke kunci asli.
    *   Indikator kunci saat ini (misal: G, A#, C#m).
*   **Fitur Autoscroll:**
    *   Tombol Play/Pause untuk memulai/menghentikan scroll otomatis.
    *   Kontrol kecepatan scroll (`-` dan `+`) dengan indikator kecepatan (1x - 5x).
    *   Menggunakan `requestAnimationFrame` untuk pergerakan yang halus.
*   **Navigasi Kembali:** Tombol atau link untuk kembali ke daftar lagu.

### 4.3 Preferensi & Aksesibilitas
*   **Dark/Light Mode:** Toggle tema yang menyimpan preferensi pengguna di `localStorage`. Secara default mengikuti preferensi sistem operasi (`prefers-color-scheme`).
*   **Responsif:** Tampilan optimal di Desktop, Tablet, dan Mobile.
*   **Aksesibilitas:** Dukungan ARIA labels, navigasi keyboard, dan kontras warna yang memadai.

## 5. Spesifikasi Teknis (Technical Stack)

| Komponen | Teknologi | Keterangan |
| :--- | :--- | :--- |
| **Frontend** | HTML5, CSS3, JavaScript (ES6+) | Tanpa framework (Vanilla JS) untuk performa maksimal. |
| **Data Storage** | JSON (`data/songs.json`) | Berisi array objek lagu dengan struktur terstandarisasi. |
| **Hosting** | Static Hosting | GitHub Pages, Vercel, atau Netlify. |
| **Styling** | Custom CSS | Menggunakan CSS Variables untuk theming. |

### Struktur Data (JSON)
Setiap entri lagu memiliki format:
```json
{
  "judul": "Nama Lagu",
  "artis": "Nama Artis",
  "genre": "Kategori Genre",
  "kunci": "Kunci Asli (misal: G)",
  "lirik": [
    { "chord": "G", "teks": "Baris lirik pertama" },
    { "chord": "", "teks": "Baris tanpa chord" }
  ]
}
```

## 6. Desain UI/UX

### Palet Warna
*   **Light Mode:** Background `#f8f9fa`, Text `#212529`, Accent `#ff8c00` (Orange), Header `#ffffff`.
*   **Dark Mode:** Background `#121826`, Text `#e8edf5`, Accent `#ffd166`, Card Background `#1b2435`.

### Komponen UI Utama
1.  **Header:** Sticky header dengan Logo dan Toggle Tema.
2.  **Search Bar:** Input field dengan border radius 8px dan efek fokus orange.
3.  **Genre Chips:** Tombol pill-shaped yang bisa di-scroll horizontal pada mobile.
4.  **Song Card:** Kartu minimalis dengan efek hover geser ke kanan.
5.  **Control Box (Detail):** Panel kontrol untuk Transpose dan Autoscroll dengan tombol-tombol intuitif.

## 7. Isu & Perbaikan yang Sedang Berjalan (Berdasarkan Audit)
Berdasarkan `AUDIT_REPORT.md`, beberapa catatan penting untuk pengembangan selanjutnya:
1.  **Bug Navigasi Filter:** Indeks lagu pada hasil filter tidak sinkron dengan ID di halaman detail. *Solusi: Gunakan ID unik atau mapping indeks yang lebih robust.*
2.  **Keamanan XSS:** Penggunaan `innerHTML` pada render judul/artis berpotensi risiko jika sumber data berubah. *Solusi: Implementasi sanitasi input atau gunakan `textContent`.*
3.  **Konsistensi Genre:** Beberapa sub-genre (seperti "Slow Rock") tidak terdeteksi oleh filter utama "Rock". *Solusi: Standarisasi taksonomi genre di level data.*

## 8. Roadmap Pengembangan Selanjutnya
*   **Fase 2:** Penambahan fitur "Favorite Songs" menggunakan LocalStorage.
*   **Fase 3:** Integrasi audio player sederhana atau link ke Spotify/YouTube.
*   **Fase 4:** Optimasi SEO untuk setiap halaman detail lagu agar mudah ditemukan di mesin pencari.
*   **Fase 5:** Migrasi ke framework ringan (seperti Preact atau Vue) jika kompleksitas fitur bertambah.

---

Dokumen ini dapat digunakan sebagai acuan bagi developer baru, stakeholder, atau untuk perencanaan sprint pengembangan selanjutnya.
