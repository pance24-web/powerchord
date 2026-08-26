
---

# Product Requirements Document (PRD)
## Proyek: PowerChord (ChordLagu)
**Versi:** 2.0 (Post-Audit & Hardening)  
**Tanggal:** 26 Agustus 2026  
**Status:** Stabil / Production Ready  
**Repo:** [pance24-web/powerchord](https://github.com/pance24-web/powerchord)

---

### 1. Ringkasan Eksekutif
**PowerChord** adalah aplikasi web statis ringan yang menyediakan database kunci gitar dan lirik lagu Indonesia. Aplikasi ini dirancang untuk musisi pemula hingga mahir yang membutuhkan akses cepat ke chord lagu dengan fitur transposisi kunci dan autoscroll lirik.

Setelah melalui proses audit keamanan dan fungsionalitas pada 25 Agustus 2026, seluruh temuan kritis (navigasi filter yang salah, kegagalan dark mode, dan kerentanan XSS potensial) telah diperbaiki. Aplikasi kini memiliki integritas data yang terjaga, aksesibilitas yang lebih baik, dan performa scroll yang optimal.

### 2. Tujuan Produk
*   Menyediakan platform gratis dan mudah diakses untuk belajar memainkan lagu-lagu populer Indonesia.
*   Memungkinkan pengguna mengubah kunci lagu (transpose) secara real-time tanpa memuat ulang halaman.
*   Membantu pengguna mengikuti lirik dan chord saat bernyanyi/bermain dengan fitur *autoscroll*.
*   Menjamin pengalaman pengguna yang nyaman di berbagai kondisi pencahayaan melalui *Dark Mode*.

### 3. Target Pengguna
*   **Pemusik Amatir:** Gitaris atau penyanyi yang butuh panduan chord cepat.
*   **Pengguna Mobile:** Musisi jalanan atau pemusik akustik yang mengakses via smartphone.
*   **Pencari Lagu Daerah:** Pengguna yang mencari spesifik genre seperti Minang, Melayu, atau Dangdut.

### 4. Fitur Utama (Functional Requirements)

#### 4.1. Halaman Depan (Home)
*   **Daftar Lagu:** Menampilkan daftar lagu dalam format kartu (Judul & Artis).
*   **Pencarian (Search):**
    *   Input teks untuk mencari berdasarkan Judul atau Artis.
    *   Minimal 2 karakter untuk memicu pencarian.
    *   Menampilkan saran (autocomplete) saat mengetik.
    *   Mendukung navigasi keyboard (tombol `Escape` untuk menutup hasil).
*   **Filter Genre:**
    *   Chip kategori: Semua, Pop, Rock, Dangdut, Pop Rock, Indie, Reggae, Minang, Melayu, Ska, Folk.
    *   **Logika Filter Cerdas:** Kategori "Rock" akan mencakup sub-genre seperti "Slow Rock", "Indie Rock", dll. Kategori "Minang" mencakup "Pop Minang".
    *   **Integritas Navigasi:** Klik pada kartu hasil filter harus membuka lagu yang benar (menggunakan indeks sumber asli, bukan indeks hasil filter).

#### 4.2. Halaman Detail Lagu
*   **Informasi Lagu:** Menampilkan Judul, Artis, dan Kunci Dasar.
*   **Transposer Chord:**
    *   Tombol `+` (Naik 1 semitone), `-` (Turun 1 semitone), dan `Reset`.
    *   Mendukung chord kompleks (misal: `Dm`, `G#7`).
    *   Update tampilan lirik dan indikator kunci secara real-time.
*   **Autoscroll Lirik:**
    *   Tombol Start/Pause untuk menggulir lirik otomatis.
    *   Pengaturan kecepatan (1x - 5x).
    *   Menggunakan `requestAnimationFrame` untuk kelancaran animasi dan mendukung `prefers-reduced-motion`.
*   **Tampilan Lirik:** Format vertikal dengan chord di atas teks lirik.

#### 4.3. Sistem Tema (Dark/Light Mode)
*   **Deteksi Otomatis:** Mengikuti preferensi sistem operasi pengguna saat pertama kali dibuka.
*   **Toggle Manual:** Tombol switch di header untuk mengubah tema.
*   **Persistensi:** Menyimpan pilihan tema pengguna di `localStorage`.
*   **Visual:** Perubahan warna latar, teks, dan elemen UI secara konsisten (sudah diperbaiki dari versi sebelumnya).

### 5. Spesifikasi Teknis & Non-Fungsional

#### 5.1. Arsitektur
*   **Jenis:** Static Website (Client-side rendering sederhana).
*   **Tech Stack:**
    *   HTML5, CSS3, Vanilla JavaScript (ES6+).
    *   Data: JSON (`data/songs.json`).
    *   Server: Python HTTP Server (`http.server`) untuk development/lokal.
*   **Tanpa Backend:** Tidak ada database server atau API eksternal; semua data dimuat dari file JSON lokal.

#### 5.2. Menjalankan dan Memeriksa Proyek
Jalankan server HTTP lokal dari root repository agar browser dapat memuat `data/songs.json` melalui `fetch()`:

```bash
npm run dev
# Buka http://localhost:8080
```

Sebelum membuat commit atau deployment, jalankan quality check berikut:

```bash
npm run check
```

Perintah tersebut memeriksa sintaks `js/main.js` dan memvalidasi struktur serta isi wajib pada `data/songs.json`. Untuk deployment, unggah seluruh isi repository ke hosting static seperti GitHub Pages, Netlify, atau Cloudflare Pages. Tidak diperlukan environment variable maupun backend server.

#### 5.3. Keamanan & Integritas Data (Hasil Audit)
*   **XSS Prevention:** Seluruh input user dan data dinamis dirender menggunakan `textContent` atau DOM API, bukan `innerHTML`, untuk mencegah injeksi skrip.
*   **Validasi Data:** Script validasi (`scripts/validate_data.py`) memastikan struktur JSON lagu konsisten sebelum deployment.
*   **Error Handling:** Penanganan graceful jika data gagal dimuat atau ID lagu tidak valid (menampilkan pesan "Lagu tidak ditemukan").
*   **Storage Safety:** Akses `localStorage` dibungkus `try/catch` untuk mencegah error pada mode privat browser.

#### 5.4. Aksesibilitas (A11y)
*   **Label Form:** Input pencarian memiliki label terhubung (`visually-hidden`).
*   **Focus Management:** Indikator fokus yang jelas (`:focus-visible`) untuk navigasi keyboard.
*   **ARIA Attributes:** Penggunaan `aria-pressed`, `aria-label`, dan `role="status"` untuk pembaca layar.
*   **Reduced Motion:** Mendukung preferensi pengguna untuk mengurangi animasi.

#### 5.5. Performa
*   **Ringan:** Tidak menggunakan framework berat (React/Vue), hanya vanilla JS.
*   **Responsif:** Layout menyesuaikan layar mobile (grid 1 kolom) dan desktop.

### 6. Struktur Data (Schema)
Data lagu disimpan dalam `data/songs.json` dengan format berikut:
```json
[
  {
    "judul": "String",
    "artis": "String",
    "genre": "String (Harus sesuai taksonomi: Pop, Rock, Pop Minang, dll)",
    "kunci": "String (Contoh: C, G, Am)",
    "lirik": [
      {
        "chord": "String (Contoh: G, D/F#)",
        "teks": "String (Baris lirik)"
      }
    ]
  }
]
```

### 7. Rencana Pengembangan Selanjutnya (Roadmap)
Mengingat versi saat ini sudah stabil pasca-audit, fokus berikutnya adalah:
1.  **Penambahan Konten:** Menambah jumlah lagu di `songs.json` (saat ini ~100 lagu).
2.  **Fitur Favorit:** Menyimpan daftar lagu favorit di `localStorage`.
3.  **PWA (Progressive Web App):** Menambahkan `manifest.json` dan Service Worker agar bisa diinstal di HP dan digunakan offline.
4.  **CI/CD:** Mengotomatisasi validasi data dan deployment ke GitHub Pages/Netlify setiap kali ada commit baru.

### 8. Metrik Keberhasilan
*   **Zero Critical Bugs:** Tidak ada lagi bug navigasi atau keamanan seperti temuan audit sebelumnya.
*   **Lighthouse Score:** Target skor >90 untuk Performance, Accessibility, dan SEO.
*   **Kepuasan Pengguna:** Fitur transpose dan autoscroll berfungsi mulus di perangkat mobile.

---
*Dokumen ini disusun berdasarkan analisis kode terbaru dan laporan audit teknis per 26 Agustus 2026.*
