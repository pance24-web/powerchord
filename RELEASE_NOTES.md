# PowerChord — Release Notes

**Release:** Accessibility, Responsive Layout, dan CLS Stabilization  
**Tanggal:** 27 Agustus 2026  
**Branch:** `main`  
**Commit terbaru:** `ab38286` — `Reduce layout shift on song detail page`  
**Repository:** `pance24-web/powerchord`

## Ringkasan release

Release ini menyelesaikan temuan audit CSS kategori **High, Medium, dan Low**, sekaligus menstabilkan layout halaman detail pada perangkat mobile. Fokus utama mencakup indikator fokus keyboard, responsive overflow, konsistensi design tokens, dark/light mode, reduced motion, state kontrol, typography, spacing, dan cumulative layout shift.

Seluruh perubahan telah dipush ke branch `main`. Working tree bersih dan `origin/main` berada pada commit yang sama dengan checkout lokal.

## Perbaikan prioritas High

### Focus ring keyboard

Beberapa rule `:focus-visible` sebelumnya menghapus outline dengan `outline: 0`, sehingga pengguna keyboard sulit mengetahui elemen yang sedang aktif. Perbaikan mengembalikan focus ring yang terlihat pada reference links, song rows, tombol transpose dan scroll, mobile bottom navigation, serta genre filter buttons.

Focus ring menggunakan outline aksen 2px dengan offset yang sesuai konteks. State `:active` pada filter dan navigasi tetap tidak menampilkan outline permanen; indikator hanya muncul ketika elemen menerima `:focus-visible`.

## Perbaikan prioritas Medium

### CSS legal terduplikasi

Style inline pada `disclaimer.html` dan `dmca.html` dihapus dan dipusatkan ke `css/style.css`. Class halaman legal juga diseragamkan menjadi `container legal-page`, `legal-notice`, dan `contact-card`. Hasilnya, tidak ada lagi tag `<style>` inline pada halaman HTML.

### Konsistensi light mode dan dark mode

Warna hard-coded untuk notice, contact card, code block, badge, dan teks di atas accent dipindahkan ke CSS custom properties. Setiap token memiliki nilai light dan dark mode sehingga halaman legal dan komponen umum tetap konsisten ketika tema berubah.

### Konsolidasi selector dan breakpoint

Selector `.logo` dan `.sidebar-list a` dirapikan agar tidak didefinisikan berulang. Override untuk theme toggle, genre filter, dan logo mobile dikonsolidasikan ke breakpoint yang sudah ada untuk mengurangi fragmentasi media query.

### Responsive overflow dan mobile spacing

Area lirik kini memiliki `width: 100%`, `min-width: 0`, `overflow-x: auto`, dan `overscroll-behavior-x: contain`. Dengan demikian, baris chord atau teks panjang tidak memperlebar halaman utama.

Safe-area inset ditambahkan pada konten mobile, footer, dan fixed bottom navigation. Perubahan ini mencegah konten tertutup home indicator atau notch pada perangkat mobile.

## Perbaikan prioritas Low

### Reduced motion

Rule `@media (prefers-reduced-motion: reduce)` kini mengatur scroll behavior, transition duration, transition delay, animation duration, dan animation iteration count. Motion non-esensial diminimalkan ketika pengguna meminta reduced motion.

Autoscroll pada halaman detail juga memeriksa preferensi `prefers-reduced-motion` melalui JavaScript. Ketika aktif, tombol autoscroll dinonaktifkan dan tetap disinkronkan jika preferensi pengguna berubah saat halaman terbuka.

### State active dan disabled

Tombol non-disabled mendapatkan feedback tekan ringan melalui `transform: scale(0.97)`. Tombol disabled memiliki cursor `not-allowed`, opacity yang lebih rendah, dan tidak menjalankan transform saat hover atau focus.

### Typography dan wrapping

`-webkit-text-size-adjust: 100%` ditambahkan untuk mencegah perubahan ukuran teks yang tidak terduga pada browser mobile. Halaman legal menggunakan `overflow-wrap: anywhere` agar email, URL, atau token panjang tidak menyebabkan overflow horizontal.

## Optimasi CLS halaman detail mobile

### Masalah

Area lirik awalnya hanya berisi placeholder `Memuat chord…`, kemudian berubah menjadi daftar lirik dinamis setelah data lagu selesai dimuat. Perubahan tinggi tersebut mendorong konten di bawahnya dan menghasilkan layout shift besar.

### Solusi

`.lirik-area` kini memiliki `min-height: 1100px`, termasuk pada breakpoint mobile. Ruang untuk konten lirik telah dicadangkan sejak awal sehingga pengisian data tidak lagi menggeser layout secara signifikan.

### Dampak terukur

| Metrik | Sebelum | Sesudah |
|---|---:|---:|
| CLS halaman detail mobile | 0,349 | **0,029** |
| Lighthouse Performance | 83 | **100** |
| FCP | 1,1 detik | 1,1 detik |
| LCP | 1,7 detik | 1,7 detik |
| TBT | 0 ms | 0 ms |

## Hasil validasi teknis

| Pemeriksaan | Hasil |
|---|---|
| `npm run build` | Lulus |
| `npm run check` | Lulus |
| `npm run verify:static` | Lulus; 7 halaman HTML, CSS, data, asset, dan security config tervalidasi |
| `npm test` | Lulus; 7 test passed, 0 failed |
| Dataset lagu | 100 lagu tervalidasi |
| HTTP smoke test | 7 halaman HTML mengembalikan HTTP 200 |
| Asset smoke test | CSS, JavaScript, JSON, `_headers`, `robots.txt`, dan `sitemap.xml` tersedia |
| `git diff --check` | Lulus |

## Lighthouse summary

Audit Lighthouse lokal dilakukan pada homepage dan halaman detail dalam mode mobile serta desktop. Perbandingan dilakukan terhadap baseline sebelum perbaikan, commit `a37a5c8`, dan versi release, commit `21ac2e1` sebelum optimasi CLS.

| Halaman | Mode | Performance | Accessibility | Best Practices | SEO |
|---|---|---:|---:|---:|---:|
| Homepage | Mobile | 100 | 100 | 100 | 100 |
| Detail lagu | Mobile, sebelum CLS | 83 | 96 | 100 | 100 |
| Detail lagu | Mobile, sesudah CLS | **100** | 96 | 100 | 100 |
| Homepage | Desktop | 100 | 100 | 100 | 100 |
| Detail lagu | Desktop | 96 | 96 | 100 | 100 |

Lighthouse masih mencatat peluang optimasi non-blocking berupa minifikasi CSS/JavaScript, unused CSS, cache lifetime, image delivery, dan beberapa kontras warna. Tidak ada temuan yang menghalangi build atau deployment.

## Cross-device testing

Pengujian Chromium dilakukan pada homepage dan halaman detail dengan total 14 screenshot pada lebar berikut:

| Lebar viewport | Hasil |
|---:|---|
| 320px | Lulus; tidak ada clipping yang terlihat |
| 375px | Lulus |
| 390px | Lulus; lirik, control bar, dan bottom navigation stabil |
| 768px | Lulus; layout satu kolom tetap rapi |
| 1024px | Lulus; layout desktop mulai aktif |
| 1280px | Lulus; layout dua kolom normal dan tidak ada horizontal overflow |
| 1440px | Lulus; layout desktop tetap proporsional |

Mode terang dan gelap juga diperiksa secara langsung. Tidak ditemukan horizontal overflow pada pemeriksaan desktop. Firefox desktop, Edge desktop, dan Safari iPhone tidak tersedia di sandbox, sehingga belum dilakukan pengujian native pada browser tersebut.

## File yang berubah

Commit utama perbaikan audit mengubah `css/style.css`, `js/main.js`, `disclaimer.html`, dan `dmca.html`. Commit optimasi CLS berikutnya mengubah `css/style.css`.

## Release status

Release telah dipush ke GitHub:

```text
Repository: pance24-web/powerchord
Branch: main
Commit: ab38286
Message: Reduce layout shift on song detail page
Status: origin/main synchronized, working tree clean
```

Release siap untuk deployment ke Cloudflare Pages menggunakan konfigurasi repository yang telah divalidasi: build command `npm run build`, root output directory `/`, Node.js 22, dan deployment dari branch `main`.

## Rekomendasi pascarelease

Setelah deployment production, jalankan PageSpeed Insights pada URL publik untuk memperoleh data lapangan dari perangkat dan jaringan nyata. Prioritas optimasi berikutnya adalah memeriksa kontras warna yang masih ditandai Lighthouse, mengevaluasi image delivery, dan mengurangi unused CSS apabila ukuran asset menjadi perhatian.
