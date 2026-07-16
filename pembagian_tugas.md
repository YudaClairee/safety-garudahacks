# Pembagian Tugas Tim (Hackathon WaktuJaga)

File ini dibuat agar seluruh anggota tim dapat melacak progress pengembangan aplikasi.
Beri tanda `[x]` pada kotak jika tugas telah diselesaikan.

## 🧑‍💻 Developer A: Fitur Warga & Autentikasi

**Area Kerja Utama:** `src/routes/login.tsx`, `src/routes/dashboard.tsx`, `src/routes/dashboard/warga.tsx`

- [x] **Setup & Init (Bersama):** Push inisialisasi awal TanStack, Supabase, Tailwind, Shadcn ke GitHub.
- [x] **Database (Supabase):**
  - [x] Buat tabel `users` (id, email, role, poin)
  - [x] Buat tabel `tasks` (id, user_id, type, status, photo_url)
  - [x] Buat bucket storage `task_photos`
- [x] **Halaman Login (`/login`):**
  - [x] Implementasi form login dan register menggunakan `supabase.auth.signInWithPassword()`.
  - [x] Redirect ke dashboard setelah sukses login.
- [x] **Halaman Warga (`/dashboard/warga`):**
  - [x] UI Card saldo "Poin Kebaikan".
  - [x] Buat **Form Lapor Tugas** (Pilih 1 dari 7 kategori tugas).
  - [x] Logika _Upload Photo_ ke Supabase Storage.
  - [x] Tampilkan riwayat/status tugas yang telah dilaporkan (Pending / Approved).
  - [x] Tombol dummy "Tukar Poin".

---

## 👨‍💻 Developer B: Fitur Corporate, Landing Page & Otomasi

**Area Kerja Utama:** `src/routes/index.tsx`, `src/routes/dashboard/corporate.tsx`, `src/routes/api/trigger-automation.ts`

- [x] **Setup & Init (Bersama):** Pull dari repository awal.
- [x] **Database (Supabase):**
  - [x] Buat tabel `csr_programs` (id, company_name, budget_rupiah, tasks_funded)
  - [x] Masukkan dummy data 1-2 perusahaan CSR melalui Supabase Dashboard.
- [x] **Landing Page (`/`):**
  - [x] Buat UI _Hero Section_ dengan desain yang menarik (Copywriting: "Waktu Jaga - Poin Kebaikan" / "Jalan - Jaringan Relawan").
  - [x] Tambahkan tombol CTA (Call to Action) yang mengarah ke halaman `/login`.
- [x] **Halaman Corporate (`/dashboard/corporate`):**
  - [x] Ambil dan tampilkan data dari tabel `csr_programs`.
  - [x] Tampilkan UI metrik/KPI: Sisa _Budget_ Rupiah dan Total Tugas yang didanai.
  - [x] Tabel log tugas yang memperlihatkan laporan warga.
- [x] **Simulasi Otomasi Webhook:**
  - [x] Buat endpoint API `/api/trigger-automation`.
  - [x] Logika API: Ubah status laporan *Pending* jadi *Approved* -> Tambah poin warga -> Kurangi budget CSR.

---

## 🚀 Fase Penggabungan (Jam 16 - 18)

- [x] Gabungkan (merge) _branch_ Warga dan Corporate.
- [x] Lakukan tes alur _end-to-end_: (Warga upload foto -> Panggil webhook otomasi -> Cek apakah budget Corporate berkurang dan poin Warga bertambah).
- [x] Polish UI, perbaiki animasi, dan persiapan bahan presentasi/pitching.

### Pembagian Batch:

- [x] **Batch 1:** Inisialisasi proyek dan Setup UI (Shadcn + Tailwind).
- [x] **Batch 2:** Landing Page (Hero, Value Proposition, How It Works) dengan animasi GSAP.
- [x] **Batch 3:** Corporate Dashboard UI (Sisa anggaran, program berjalan) & Integrasi fetch data dummy/DB.
- [x] **Batch 4:** Form Create Program & Validasi untuk Perusahaan.
