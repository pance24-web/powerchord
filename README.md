## 📄 Product Requirements Document (PRD) — PowerChord

### Proyek: PowerChord (ChordLagu)

| **Dokumen**     | **Detail**                                                          |
| --------------- | ------------------------------------------------------------------- |
| Nama Produk     | PowerChord                                                          |
| Versi           | 2.0 (Design Final)                                                  |
| Tanggal         | 31 Agustus 2026                                                     |
| Status          | **Final — Siap Pengembangan**                                       |
| Repo            | [pance24-web/powerchord](https://github.com/pance24-web/powerchord) |
| Target Platform | Web (Responsive) + Mobile App (Android/iOS)                         |

---

## 1. Ringkasan Eksekutif

**PowerChord** adalah aplikasi web statis ringan yang menyediakan database kunci gitar dan lirik lagu Indonesia. Aplikasi ini dirancang untuk musisi pemula hingga mahir yang membutuhkan akses cepat ke chord lagu dengan fitur transposisi kunci, autoscroll lirik, dan **tema dark premium** yang modern.

Setelah melalui proses audit keamanan dan fungsionalitas pada 25 Agustus 2026, seluruh temuan kritis (navigasi filter yang salah, kegagalan dark mode, dan kerentanan XSS potensial) telah diperbaiki. Aplikasi kini memiliki integritas data yang terjaga, aksesibilitas yang lebih baik, dan performa scroll yang optimal.

**Desain Final:** Dark & Premium dengan aksen oranye modern `#F97316` — memberikan kesan energik, modern, dan mudah dikenali.

---

## 2. Tujuan Produk

1. Menyediakan platform gratis dan mudah diakses untuk belajar memainkan lagu-lagu populer Indonesia.
2. Memungkinkan pengguna mengubah kunci lagu (transpose) secara real-time tanpa memuat ulang halaman.
3. Membantu pengguna mengikuti lirik dan chord saat bernyanyi/bermain dengan fitur _autoscroll_.
4. Menjamin pengalaman pengguna yang nyaman di berbagai kondisi pencahayaan melalui **Dark Mode** (default) dan **Light Mode** sebagai opsi.
5. Memberikan identitas visual yang kuat dan modern dengan aksen oranye `#F97316`.

---

## 3. Target Pengguna

| **Persona**             | **Deskripsi**                                                                                                      |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Andi (Pemula)**       | Pelajar SMA (17 tahun) yang ingin belajar gitar untuk mengiringi lagu favorit. Butuh diagram chord dan lagu mudah. |
| **Siti (Mobile-First)** | Karyawan (24 tahun) yang sering kehabisan kuota. Butuh offline mode, autoscroll, dan update lagu viral.            |
| **Budi (Musisi)**       | Pemusik gereja & pengajar gitar (32 tahun). Butuh transpose akurat, capo suggestion, dan koleksi lagu rohani.      |
| **Pencari Lagu Daerah** | Pengguna yang mencari spesifik genre seperti Minang, Melayu, atau Dangdut.                                         |

---

## 4. Fitur Utama (Functional Requirements)

### 4.1. Halaman Depan (Home)

**Desain:** List-style (seperti Spotify) dengan grid 4 kolom di desktop.

| **Fitur**              | **Deskripsi**                                                                                                                                                                                                                                                         |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Daftar Lagu**        | Menampilkan daftar lagu dalam format list (Judul, Artis, dan tombol "Chord").                                                                                                                                                                                         |
| **Pencarian (Search)** | Input teks untuk mencari berdasarkan Judul atau Artis. Minimal 2 karakter untuk memicu pencarian. Menampilkan saran (autocomplete) saat mengetik. Mendukung navigasi keyboard (tombol `Escape` untuk menutup hasil).                                                  |
| **Filter Genre**       | Chip kategori: Semua, Pop, Rock, Dangdut, Pop Rock, Indie, Reggae, Minang, Melayu, Ska, Folk. **Logika Filter Cerdas:** Kategori "Rock" mencakup sub-genre. **Integritas Navigasi:** Klik pada kartu hasil filter membuka lagu yang benar menggunakan stable ID/slug. |
| **Navigasi**           | **Mobile:** Hamburger drawer (kiri) dengan menu + search bar di dalamnya. **Desktop:** Sidebar permanen (kiri) + konten utama di kanan. Tidak ada bottom nav.                                                                                                         |

### 4.2. Halaman Detail Lagu

**Desain:** Fokus pada lirik & chord, dengan kontrol transpose & autoscroll yang sticky.

| **Fitur**            | **Deskripsi**                                                                                                                                                                                                                                                   |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Informasi Lagu**   | Menampilkan Judul, Artis, dan Kunci Dasar.                                                                                                                                                                                                                      |
| **Transposer Chord** | Tombol `+` (Naik 1 semitone), `-` (Turun 1 semitone), dan `Reset`. Mendukung chord kompleks (misal: `Dm`, `G#7`). Update tampilan lirik dan indikator kunci secara real-time. **Aksen warna:** Oranye `#F97316` pada chord yang ditranspose.                    |
| **Autoscroll Lirik** | Tombol Start/Pause untuk menggulir lirik otomatis. Pengaturan kecepatan (1x - 10x) dengan slider. Menggunakan `requestAnimationFrame` untuk kelancaran animasi dan mendukung `prefers-reduced-motion`. **Aksen warna:** Tombol aktif berwarna oranye `#F97316`. |
| **Tampilan Lirik**   | Format vertikal dengan chord di atas teks lirik. Font monospace (`Courier New`) untuk presisi chord. Chord di-highlight dengan warna oranye `#F97316`.                                                                                                          |
| **Aksi Tambahan**    | Tombol **Simpan (Bookmark)** ⭐ dan **Offline** 💾 dengan ikon kecil (subtle). Status tersimpan muncul sebagai badge kecil di pojok.                                                                                                                            |

### 4.3. Sistem Tema (Dark/Light Mode)

| **Fitur**            | **Deskripsi**                                                                                                                                                         |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Default Tema**     | **Dark Mode** sebagai default (premium & nyaman di mata).                                                                                                             |
| **Deteksi Otomatis** | Mengikuti preferensi sistem operasi pengguna saat pertama kali dibuka.                                                                                                |
| **Toggle Manual**    | Tombol switch di header untuk mengubah tema.                                                                                                                          |
| **Persistensi**      | Menyimpan pilihan tema pengguna di `localStorage`.                                                                                                                    |
| **Visual**           | Dark: latar `#121212`, card `#1E1E1E`, input `#2A2A2A`, teks `#E8E8E8`. Light: latar `#F4F4F4`, teks `#1A1A1A`. Aksen oranye `#F97316` tetap konsisten di kedua mode. |

---

## 5. Desain UI/UX (Final)

### 5.1. Filosofi Desain

- **Dark & Premium:** Latar gelap (`#121212`) sebagai default untuk pengalaman menonton/bermain yang imersif.
- **Energi & Modern:** Aksen oranye terang (`#F97316`) memberi "Power" pada nama PowerChord.
- **Netral & Fokus:** Warna netral (abu-abu, putih) untuk menjaga fokus pada konten (lirik & chord).
- **Mobile-First:** Responsif, dengan hamburger drawer untuk navigasi mobile dan sidebar untuk desktop.

### 5.2. Color Palette (Final)

| **Peran**             | **Warna**          | **Hex**                  | **Penggunaan**                                     |
| --------------------- | ------------------ | ------------------------ | -------------------------------------------------- |
| **Aksen Brand**       | Oranye Modern      | `#F97316`                | Tombol Primary, Highlight Chord, Ikon Aktif, Badge |
| **Hover Aksen**       | Oranye Tua         | `#EA580C`                | Hover tombol & elemen interaktif                   |
| **Aksen Gelap**       | Oranye Pekat       | `#C2410C`                | Variasi gelap untuk state tertentu                 |
| **Background**        | Hitam Pekat        | `#121212`                | Latar belakang utama (Dark Mode)                   |
| **Surface**           | Abu-abu Gelap      | `#1E1E1E`                | Card, Drawer, Komponen                             |
| **Input**             | Abu-abu Sedang     | `#2A2A2A`                | Input field, Search bar                            |
| **Text Primary**      | Putih Keabu-abuan  | `#E8E8E8`                | Judul lagu, teks utama                             |
| **Text Secondary**    | Abu-abu Terang     | `#AAAAAA`                | Nama artis, views, info pendukung                  |
| **Label/Placeholder** | Abu-abu            | `#888888`                | Placeholder, label non-interaktif                  |
| **Border**            | Abu-abu Transparan | `rgba(255,255,255,0.05)` | Divider, border elemen                             |
| **Light Mode Base**   | Putih              | `#F4F4F4` / `#FFFFFF`    | Opsional untuk pengguna yang suka terang           |

### 5.3. Typography

- **Font Utama:** Inter (Google Fonts)
- **Skala:**
  - H1: 2.8rem / 800 (Judul lagu)
  - H2: 2rem / 700
  - H3: 1.4rem / 700
  - Body: 1rem / 400
  - Meta: 0.85rem / 400 (`#AAAAAA`)
  - Chord: `Courier New`, monospace, 0.9rem, warna aksen `#F97316`

### 5.4. UI Components

| **Komponen**         | **Deskripsi**                                                                        |
| -------------------- | ------------------------------------------------------------------------------------ |
| **Tombol Primary**   | Background `#F97316`, teks `#121212`, hover `#EA580C`                                |
| **Tombol Secondary** | Background `rgba(255,255,255,0.06)`, hover lebih terang                              |
| **Tombol Outline**   | Border `#F97316`, teks `#F97316`, hover solid orange                                 |
| **Input/Search**     | Background `#2A2A2A`, border jadi `#F97316` saat focus                               |
| **Card Lagu**        | Background `#1E1E1E`, border transparan, hover shadow                                |
| **Badge**            | Background `#F97316`, teks `#121212`                                                 |
| **Drawer**           | Background `#121212` / `#1E1E1E`, item active `#F97316` dengan background transparan |

---

## 6. Spesifikasi Teknis & Non-Fungsional

### 6.1. Arsitektur

- **Jenis:** Static Website (Client-side rendering sederhana).
- **Tech Stack:**
  - HTML5, CSS3, Vanilla JavaScript (ES6+).
  - Data: JSON (`data/songs.json`).
  - Server: Python HTTP Server (`http.server`) untuk development/lokal.
- **Tanpa Backend:** Tidak ada database server atau API eksternal; semua data dimuat dari file JSON lokal.

### 6.2. Menjalankan dan Memeriksa Proyek

Jalankan server HTTP lokal dari root repository agar browser dapat memuat `data/songs.json` melalui `fetch()`:

```bash
npm run dev
# Buka http://localhost:8080
```

Sebelum membuat commit atau deployment, jalankan quality check berikut:

```bash
npm ci
npm run build
```

`npm run build` menjalankan syntax check JavaScript, validasi dataset, static verifier untuk HTML/asset/reference, dan unit test. `npm run check` dapat digunakan untuk quality check cepat. Untuk deployment Cloudflare Pages, lihat [`DEPLOYMENT.md`](DEPLOYMENT.md). Tidak diperlukan backend server atau environment variable runtime.

### 6.2.1 Database lokal

Dataset canonical tetap berada di `data/songs.json` agar situs statis dapat memuat data tanpa backend. Untuk kebutuhan query terstruktur, analisis, atau integrasi backend pada tahap berikutnya, repositori menyediakan skema SQLite di `database/schema.sql` dan skrip seed di `scripts/seed_database.py`.

Buat atau segarkan database lokal dengan:

```bash
npm run db:seed
```

Database menghasilkan dua tabel utama: `songs` menyimpan metadata lagu dan `song_lines` menyimpan baris chord/lirik dengan relasi satu-ke-banyak. Foreign key dengan `ON DELETE CASCADE` menjaga agar baris lirik tidak tertinggal ketika lagu dihapus. View `song_catalog` menyediakan katalog ringkas beserta jumlah baris lirik. File hasil generate berada di `database/powerchord.sqlite3` dan tidak digunakan langsung oleh halaman statis saat ini.

### 6.3. Keamanan & Integritas Data (Hasil Audit)

- **XSS Prevention:** Seluruh input user dan data dinamis dirender menggunakan `textContent` atau DOM API, bukan `innerHTML`, untuk mencegah injeksi skrip.
- **Validasi Data:** Script validasi (`scripts/validate_data.py`) memastikan struktur JSON lagu konsisten sebelum deployment.
- **Error Handling:** Penanganan graceful jika data gagal dimuat atau ID lagu tidak valid (menampilkan pesan "Lagu tidak ditemukan").
- **Storage Safety:** Akses `localStorage` dibungkus `try/catch` untuk mencegah error pada mode privat browser.

### 6.4. Aksesibilitas (A11y)

- **Label Form:** Input pencarian memiliki label terhubung (`visually-hidden`).
- **Focus Management:** Indikator fokus yang jelas (`:focus-visible`) untuk navigasi keyboard.
- **ARIA Attributes:** Penggunaan `aria-pressed`, `aria-label`, dan `role="status"` untuk pembaca layar.
- **Reduced Motion:** Mendukung preferensi pengguna untuk mengurangi animasi.

### 6.5. Performa

- **Ringan:** Tidak menggunakan framework berat (React/Vue), hanya vanilla JS.
- **Responsif:** Layout menyesuaikan layar mobile (list 1 kolom) dan desktop (grid 4 kolom, sidebar permanen).
- **Target Metrik:**
  - First Contentful Paint (FCP): < 1.5 detik
  - Largest Contentful Paint (LCP): < 2.5 detik
  - Time to Interactive (TTI): < 3 detik
  - Search Response Time: < 200 ms

---

## 7. Struktur Data (Schema)

Data lagu disimpan dalam `data/songs.json` dengan format berikut:

```json
[
  {
    "id": "slug-stabil",
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

**Catatan:** Untuk mendukung fitur transpose, chord harus ditulis dalam format yang sesuai dengan keyIndex (`C, C#, D, D#, E, F, F#, G, G#, A, A#, B`).

---

## 8. Rencana Pengembangan Selanjutnya (Roadmap)

| **Phase**                      | **Fitur**                                                                                                            | **Status**       |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------- | ---------------- |
| **Phase 1: MVP (Selesai)**     | Koleksi 5.000 chord, Pencarian, Transpose, Autoscroll, Dark Mode (default), Bookmark, Desain Responsif               | ✅ Selesai       |
| **Phase 2: Growth (Sekarang)** | Offline Mode, Diagram Chord (fretboard), Capo Suggestion, History, Koleksi 10.000 lagu, User Account (login)         | 📋 Dalam Rencana |
| **Phase 3: Engagement**        | Rekomendasi AI, Request Chord, Komunitas (komentar/forum), Mobile App (Android)                                      | 📋 Rencana       |
| **Phase 4: Monetization**      | Premium Tier (offline unlimited, no ads), Iklan Non-Intrusif (free tier), Mobile App (iOS), Guitar Tuner integration | 📋 Rencana       |

**Prioritas Segera:**

1. **Penambahan Konten:** Menambah jumlah lagu di `songs.json` dengan mengikuti schema dan taxonomy validator.
2. **Fitur Favorit:** Menyimpan daftar lagu favorit di `localStorage`. ✅ (Sudah ada di prototype)
3. **Offline Mode:** Menyimpan lagu untuk akses tanpa internet. ✅ (Sudah ada di prototype)
4. **PWA (Progressive Web App):** Menambahkan `manifest.json` dan Service Worker agar bisa diinstal di HP dan digunakan offline.
5. **Deployment:** CI quality gate tersedia pada `.github/workflows/ci.yml`; deployment Cloudflare Pages diatur mengikuti `DEPLOYMENT.md`.

---

## 9. Metrik Keberhasilan

| **Metrik**                   | **Target**                                                                |
| ---------------------------- | ------------------------------------------------------------------------- |
| **Zero Critical Bugs**       | Tidak ada lagi bug navigasi atau keamanan seperti temuan audit sebelumnya |
| **Lighthouse Score**         | Target skor >90 untuk Performance, Accessibility, dan SEO                 |
| **Monthly Active Users**     | 500.000 (Year 1)                                                          |
| **User Retention (30 hari)** | 40%                                                                       |
| **Average Session Duration** | 5+ menit                                                                  |
| **Offline Usage Rate**       | 30% dari total pengguna                                                   |
| **Kepuasan Pengguna**        | Fitur transpose dan autoscroll berfungsi mulus di perangkat mobile        |

---

## 10. Risks & Mitigation

| **Risiko**             | **Dampak** | **Mitigasi**                                                                                    |
| ---------------------- | ---------- | ----------------------------------------------------------------------------------------------- |
| **Hak Cipta**          | Tinggi     | Gunakan chord sebagai data (bukan notasi melody), kerja sama dengan publisher, berikan atribusi |
| **Kompetitor Dominan** | Sedang     | Fokus pada niche (lagu Indonesia, UI modern, offline) sebagai diferensiasi                      |
| **Kualitas Konten**    | Sedang     | Kurasi internal + mekanisme pelaporan error dari pengguna                                       |
| **Adopsi Pengguna**    | Sedang     | Strategi SEO agresif, konten viral, integrasi media sosial                                      |

---

## 11. Appendix: Design Deliverables

| **Deliverable**             | **Status**                                  | **Lokasi**                       |
| --------------------------- | ------------------------------------------- | -------------------------------- |
| Wireframe (Konsep)          | ✅ Selesai                                  | Tersedia di dokumentasi desain   |
| UI Kit (Design System)      | ✅ Selesai — Dark Modern + Oranye `#F97316` | Tersedia di `design-system.html` |
| Prototype Interaktif (HTML) | ✅ Selesai                                  | Tersedia di `index.html` (repo)  |
| User Testing Plan           | 📋 Siap dijalankan                          | Akan disusun                     |
| PRD Final                   | ✅ Selesai                                  | Dokumen ini                      |

---

> **Dokumen ini adalah living document dan akan diperbarui seiring dengan perkembangan produk.**
>
> **Status:** ✅ FINAL — Siap masuk tahap pengembangan konten & fitur lanjutan.
>
> _Dokumen ini disusun berdasarkan analisis kode terbaru, laporan audit teknis, dan keputusan desain final untuk release v2.0._

---

### ✅ Perubahan yang Saya Lakukan

| **Elemen**        | **PRD Asli (v1.1)**            | **PRD Final (v2.0)**                                                        |
| ----------------- | ------------------------------ | --------------------------------------------------------------------------- |
| **Desain UI/UX**  | Tidak disebutkan secara detail | ✅ Ditambahkan section lengkap (filosofi, palet warna, tipografi, komponen) |
| **Warna Brand**   | Tidak disebutkan               | ✅ Oranye modern `#F97316` dengan varian hover & dark                       |
| **Tema Default**  | Dark Mode sebagai fitur        | Dark Mode sebagai **default** (premium)                                     |
| **Navigasi**      | Tidak disebutkan               | Hamburger drawer (mobile) + sidebar (desktop)                               |
| **Tombol Aksi**   | Tidak disebutkan               | Subtle icons (Bookmark, Offline, Share) dengan status badge                 |
| **User Personas** | Tidak ada                      | ✅ Ditambahkan 3 persona (Andi, Siti, Budi)                                 |
| **Roadmap**       | Ada                            | ✅ Diperjelas dengan fase dan status                                        |
| **Metrik Sukses** | Ada                            | ✅ Ditambahkan target kuantitatif                                           |
| **Risiko**        | Tidak ada                      | ✅ Ditambahkan risk & mitigation                                            |

---
