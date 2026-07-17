# Pembagian Tugas Baru (Fitur Pendaftaran Hari-H & ESG Dashboard)

Dokumen ini membagi tugas untuk dua fitur baru agar dapat dikerjakan secara paralel oleh Developer A dan Developer B tanpa saling memblokir.

## 🧑‍💻 Developer A: Fitur Pendaftaran & Validasi Hari-H (Sisi Warga)

**Fokus Utama:** Alur pendaftaran warga untuk program CSR dan pembatasan pengiriman tugas hanya pada hari-H.
**Area Kerja:** `schema.sql`, `src/routes/dashboard/warga.tsx`, `src/routes/dashboard/corporate.tsx` (Form Pembuatan Program).

- [x] **Database & Schema:**
  - Tambahkan kolom `start_date` dan `end_date` (atau `event_date`) pada tabel `csr_programs`.
  - Buat tabel baru `program_registrations` untuk melacak warga yang sudah mendaftar pada program tertentu (kolom: `id`, `user_id`, `program_id`, `registered_at`).
- [x] **Dashboard Corporate (Form Buat Program):**
  - Update form pembuatan program CSR untuk menyertakan input rentang waktu (`start_date` & `end_date`) atau tanggal pelaksanaan event.
- [x] **Dashboard Warga (Alur Pendaftaran):**
  - Tampilkan status program berdasarkan waktu (Pendaftaran Dibuka / Sedang Berjalan / Selesai).
  - Buat tombol dan fungsi logika **"Daftar Program"** agar warga dapat mendaftar (menyimpan data ke `program_registrations`).
- [x] **Dashboard Warga (Alur Pengiriman Tugas/Hari-H):**
  - Sembunyikan form "Kirim Bukti Tugas" jika program belum dimulai atau warga tersebut belum mendaftar.
  - Tampilkan form "Kirim Bukti Tugas" **hanya** jika warga sudah terdaftar dan waktu saat ini telah memasuki hari-H (`start_date`).

---

## 👨‍💻 Developer B: ESG Dashboard & PDF Export (Sisi Corporate)

**Fokus Utama:** Menambahkan widget metrik impact keberlanjutan (ESG) pada dashboard corporate dan fitur ekspor laporan ke format PDF.
**Area Kerja:** `src/routes/dashboard/corporate.tsx`, CSS Print Stylesheet atau Library Export PDF.

- [ ] **UI Widget Metrik Safety Impact & ESG:**
  - Rancang dan tambahkan widget statistik baru di halaman Dashboard Corporate.
- [ ] **Kalkulasi Data Metrik:**
  - **Total Warga Terbantu (Safety Net Metric):** Hitung total warga yang berpartisipasi (dari tabel `tasks` berstatus `approved`), atau gunakan *multiplier* untuk mengestimasi dampak ke keluarga (misal 1 warga = 1 keluarga).
  - **Aksi Mitigasi Berhasil:** Agregasi jumlah tugas/mitigasi lingkungan yang berhasil (status `approved`) di berbagai lokasi program.
- [ ] **Implementasi PDF Export (ESG Report):**
  - Siapkan tata letak/layout ringkasan laporan (bisa berupa section khusus atau halaman print).
  - Buat tombol **"Download ESG Report (PDF)"**.
  - Implementasikan logika download/cetak. Bisa menggunakan teknik *quick hack* CSS `@media print` dengan `window.print()` atau pustaka seperti `jspdf` / `html2canvas`.
- [ ] **Finishing & Testing:**
  - Pastikan output PDF yang ter-generate terlihat rapi, menampilkan ringkasan metrik ESG, log aktivitas, dan branding perusahaan.
