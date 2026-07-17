# Ringkasan Aplikasi — Jalan (Jaringan Relawan)

## Tujuan
Aplikasi "Jalan" menghubungkan inisiatif aksi sosial warga dengan pendanaan CSR perusahaan secara transparan dan (semi-)otomatis. Relawan mengunggah bukti tindakan lapangan; perusahaan membuat program CSR yang dapat mendanai tugas relevan dan memberikan Poin Kebaikan kepada relawan.

## Fitur Utama
- Autentikasi via Supabase Auth; role: `warga` atau `corporate`.
- Warga:
  - Unggah laporan tugas dengan foto (storage bucket `task_photos`).
  - Lihat saldo Poin Kebaikan dan riwayat tugas.
  - Tukar poin (UI mock).
- Corporate:
  - Daftarkan program CSR (budget, fokus kategori, lokasi, reward points).
  - Lihat log tugas warga; setuju/tolak tugas secara manual.
  - Jalankan simulasi automasi (webhook) untuk memproses tasks pending.
- Automasi (/api/trigger-automation): proses tasks `pending` → cari program dengan budget cukup → kurangi anggaran → tambahkan poin ke user → set task jadi `approved`.

## Alur Singkat
1. Warga submit laporan (foto + deskripsi) → record `tasks` status `pending`.
2. Endpoint automasi (`/api/trigger-automation`) memproses semua `pending`:
   - Tambah 1000 poin ke user.
   - Kurangi `budget_rupiah` program sebesar Rp 250.000 dan tambah `tasks_funded`.
   - Update `tasks.status` menjadi `approved` dan isi `company_name`.

## File & Lokasi Penting
- Konfigurasi & metadata: `package.json`, `README.md`, `schema.sql`.
- Supabase client: `src/lib/supabase.ts`.
- API automasi / webhook: `src/routes/api/trigger-automation.ts`.
- Frontend routes:
  - Landing: `src/routes/index.tsx`
  - Login/Register: `src/routes/login.tsx`
  - Dashboard (guard & redirect): `src/routes/dashboard.tsx`
  - Dashboard warga: `src/routes/dashboard/warga.tsx`
  - Dashboard corporate: `src/routes/dashboard/corporate.tsx`
- Tipe & util: `src/lib/types.ts`, `src/lib/utils.ts`.
- Simulasi end-to-end: `test_webhook.mjs`.

## Database (ringkasan dari `schema.sql`)
- `public.users` (id -> auth.users.id, email, role, points).
  - Trigger: saat auth.users bertambah, baris baru dibuat di `public.users`.
- `public.tasks` (id, user_id, type, status, photo_url, company_name, location, description).
- `public.csr_programs` (id, company_name, budget_rupiah, tasks_funded, focus_category, location, reward_points).
- Storage bucket `task_photos` (public dalam schema.sql).
- RLS dan policy di schema disetel longgar di beberapa tempat (dengan komentar "Hackathon MVP").

## Cara Menjalankan (lokal)
1. Pastikan environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
2. Install & jalankan:

```bash
pnpm install
# tambahkan .env dengan VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY
pnpm dev
```

3. (Opsional) Untuk simulasi end-to-end (server harus berjalan di `http://localhost:3000`):

```bash
node test_webhook.mjs
```

## Demo singkat untuk teman
1. Jalankan app lokal dan siapkan `.env` dengan kredensial Supabase dev.
2. Buka `/login` → daftar sebagai `warga` → submit laporan tugas di dashboard warga (unggah foto).
3. Login sebagai `corporate` (atau create company di dashboard corporate) → buat program CSR dengan anggaran >= Rp 250000.
4. Di dashboard corporate klik "Simulasi Webhook Otomasi" atau akses `GET /api/trigger-automation`.
5. Periksa DB: task jadi `approved`, user poin bertambah, dan program budget berkurang.

## Catatan & Rekomendasi
- Nilai-nilai (poin 1000, potongan Rp 250.000) dikodekan statis; pertimbangkan buat konfigurasi.
- Operasi server-side yang butuh hak penuh sebaiknya dijalankan dengan Service Role Key (bukan anon key di client).
- Kebijakan RLS di `schema.sql` bersifat longgar (komentar "Hackathon MVP"); perketat untuk produksi.
- Pastikan bucket `task_photos` dibuat di Supabase dan policy storage cocok untuk produksi (privasi/batasan upload).

---
File ini dibuat untuk membantu menjelaskan proyek ke rekan tim. Jika ingin, saya bisa:
- Membuat versi PDF/slide, atau
- Menambahkan "how-to demo" checklist yang bisa diikuti langkah demi langkah saat presentasi.

