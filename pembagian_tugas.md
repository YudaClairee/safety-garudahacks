# Pembagian Tugas Tim (Hackathon WaktuJaga)

File ini dibuat agar seluruh anggota tim dapat melacak progress pengembangan aplikasi.
Beri tanda `[x]` pada kotak jika tugas telah diselesaikan.

## 🧑‍💻 Developer A: Fitur Warga & Autentikasi
**Area Kerja Utama:** `src/routes/login.tsx`, `src/routes/dashboard.tsx`, `src/routes/dashboard/warga.tsx`

- [x] **Setup & Init (Bersama):** Push inisialisasi awal TanStack, Supabase, Tailwind, Shadcn ke GitHub.
- [ ] **Database (Supabase):**
  - [ ] Buat tabel `users` (id, email, role, poin)
  - [ ] Buat tabel `tasks` (id, user_id, type, status, photo_url)
  - [ ] Buat bucket storage `task_photos`
- [ ] **Halaman Login (`/login`):** 
  - [ ] Implementasi form login dan register menggunakan `supabase.auth.signInWithPassword()`.
  - [ ] Redirect ke dashboard setelah sukses login.
- [ ] **Halaman Warga (`/dashboard/warga`):**
  - [ ] UI Card saldo "Poin Kebaikan".
  - [ ] Buat **Form Lapor Tugas** (Pilih 1 dari 7 kategori tugas).
  - [ ] Logika *Upload Photo* ke Supabase Storage.
  - [ ] Tampilkan riwayat/status tugas yang telah dilaporkan (Pending / Approved).
  - [ ] Tombol dummy "Tukar Poin".

---

## 👨‍💻 Developer B: Fitur Corporate, Landing Page & Otomasi
**Area Kerja Utama:** `src/routes/index.tsx`, `src/routes/dashboard/corporate.tsx`, `src/routes/api/trigger-automation.ts`

- [x] **Setup & Init (Bersama):** Pull dari repository awal.
- [ ] **Database (Supabase):**
  - [ ] Buat tabel `csr_programs` (id, company_name, budget_rupiah, tasks_funded)
  - [ ] Masukkan dummy data 1-2 perusahaan CSR melalui Supabase Dashboard.
- [ ] **Landing Page (`/`):**
  - [ ] Buat UI *Hero Section* dengan desain yang menarik (Copywriting: "Waktu Jaga - Poin Kebaikan").
  - [ ] Tambahkan tombol CTA (Call to Action) yang mengarah ke halaman `/login`.
- [ ] **Halaman Corporate (`/dashboard/corporate`):**
  - [ ] Ambil dan tampilkan data dari tabel `csr_programs`.
  - [ ] Tampilkan UI metrik/KPI: Sisa *Budget* Rupiah dan Total Tugas yang didanai.
  - [ ] Tabel log tugas yang memperlihatkan laporan warga.
- [ ] **Simulasi Otomasi Webhook:**
  - [ ] Buat endpoint API `/api/trigger-automation`.
  - [ ] Logika API: Ubah status laporan *Pending* jadi *Approved* -> Tambah poin warga -> Kurangi budget CSR.

---

## 🚀 Fase Penggabungan (Jam 16 - 18)
- [ ] Gabungkan (merge) *branch* Warga dan Corporate.
- [ ] Lakukan tes alur *end-to-end*: (Warga upload foto -> Panggil webhook otomasi -> Cek apakah budget Corporate berkurang dan poin Warga bertambah).
- [ ] Polish UI, perbaiki animasi, dan persiapan bahan presentasi/pitching.
