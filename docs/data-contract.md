# Kontrak Data Lagu PowerChord

PowerChord menggunakan satu bentuk data kanonik di seluruh frontend, fallback lokal, dan service layer. Sumber lama yang masih memakai `judul`, `artis`, `kunci`, `lirik`, atau `teks` dinormalisasi sebelum digunakan oleh UI.

## Bentuk kanonik

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
    { "chord": "C", "text": "Contoh baris lirik" }
  ],
  "status": "published",
  "updated_at": "2026-09-14T00:00:00Z"
}
```

Field `id` adalah slug publik yang stabil. `legacy_id` opsional dan hanya digunakan untuk kompatibilitas link numerik. Hanya data dengan `status: "published"` yang boleh masuk katalog publik. `capo` menggunakan bilangan bulat non-negatif; nilai default-nya adalah `0`.

## Alur sumber data

`public/js/song-service.js` menyediakan `normalizeSong`, `normalizeAndValidateSongs`, dan `fetchLocalSongs`. Supabase dinormalisasi di `public/js/supabase.js`, lalu divalidasi kembali oleh service layer. Jika Supabase tidak tersedia atau mengembalikan format rusak, aplikasi menggunakan `data/songs.json` melalui jalur fallback yang sama. Fallback tidak dipakai diam-diam untuk response remote yang tidak valid; error remote dicatat melalui logger debug dan proses fallback tetap tervalidasi.

## Validasi release

Dataset sumber berada di `data/songs.json` dan disalin ke `public/data/songs.json` saat `prepare:public`. `python3 scripts/validate_data.py` memeriksa field wajib, slug unik, identitas lagu unik, key, lyrics, serta status publikasi. `npm run build` menjalankan lint, validator, static verification, dan unit test sebelum hasil deployment dianggap siap.
