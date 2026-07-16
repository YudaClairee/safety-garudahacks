# Panduan Implementasi MVP "WaktuJaga"

Dokumen ini berisi langkah-langkah implementasi teknis yang sangat detail dari awal hingga akhir untuk membangun MVP WaktuJaga dalam batasan waktu 18 jam (Hackathon).

## Ringkasan Tech Stack

- **Framework:** TanStack Start (dengan React)
- **Routing:** TanStack Router (terbawa otomatis di TanStack Start)
- **Data Fetching & State:** TanStack Query
- **Styling & UI:** Tailwind CSS + Radix UI (menggunakan generator komponen seperti shadcn/ui untuk mempercepat styling)
- **Database, Auth & Storage:** Supabase (PostgreSQL)

---

## Langkah 1: Setup Supabase (Backend as a Service)

Sebelum menulis kode frontend, kita harus menyiapkan backend di Supabase.

### 1.1 Buat Project & Auth

1. Buka [Supabase Dashboard](https://supabase.com/dashboard) dan buat project baru.
2. Ke menu **Authentication -> Providers**, pastikan **Email** enabled (default).
3. Matikan "Confirm email" sementara untuk mempermudah testing saat hackathon.

### 1.2 Setup Storage (Untuk Foto Tugas)

1. Ke menu **Storage**, buat bucket baru bernama `task-photos`.
2. Buat bucket menjadi **Public** agar foto mudah diakses melalui URL.

### 1.3 Schema Database & Table

Buka menu **SQL Editor** di Supabase dan jalankan script ini untuk membuat tabel:

```sql
-- 1. Buat custom ENUM untuk role dan status tugas
CREATE TYPE user_role AS ENUM ('warga', 'corporate');
CREATE TYPE task_status AS ENUM ('pending', 'approved', 'rejected');

-- 2. Buat tabel Users (meng-extend auth.users dari Supabase)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  role user_role NOT NULL,
  full_name TEXT NOT NULL,
  balance NUMERIC DEFAULT 0
);

-- 3. Buat tabel CSR Programs (Dulu: corporate_funds)
CREATE TABLE public.csr_programs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name TEXT NOT NULL,
  program_title TEXT NOT NULL,
  total_budget NUMERIC NOT NULL,
  funds_disbursed NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE
);

-- 4. Buat tabel Tasks
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  warga_id UUID REFERENCES public.users(id) NOT NULL,
  program_id UUID REFERENCES public.csr_programs(id) NOT NULL,
  task_type TEXT NOT NULL,
  hours_spent NUMERIC NOT NULL,
  photo_url TEXT NOT NULL,
  status task_status DEFAULT 'pending',
  credit_earned NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Disable RLS (Row Level Security) untuk MVP agar cepat
-- PERINGATAN: Ini HANYA untuk hackathon. Di production RLS wajib dihidupkan.
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.csr_programs DISABLE ROW LEVEL SECURITY;

-- 6. Masukkan Dummy Data CSR Programs
INSERT INTO public.csr_programs (company_name, program_title, total_budget)
VALUES
('PT Garuda Nusantara', 'Bakti Lingkungan Jakarta', 50000000),
('Bank BCA', 'Pelatihan Digital Desa', 25000000);
```

---

## Langkah 2: Inisialisasi Project Frontend

Jalankan perintah berikut di terminal:

```bash
npm create @tanstack/start@latest .
# Atau jika gagal: npx @tanstack/cli create
# - Pilih "React"
# - Pilih bundler "Vite"
```

Masuk ke folder project dan install _dependencies_:

```bash
npm install @supabase/supabase-js @tanstack/react-query lucide-react
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Inisialisasi `shadcn/ui` (Radix UI + Tailwind wrapper):

```bash
npx shadcn-ui@latest init
# Pilih gaya Default/New York dan warna base favorit.

# Install komponen yang akan dipakai:
npx shadcn-ui@latest add button card input label select table toast form
```

---

## Langkah 3: Setup Konfigurasi Klien (Supabase & Query)

### 3.1 `.env.local`

Buat file env di root project:

```env
VITE_SUPABASE_URL=https://[PROJECT-ID].supabase.co
VITE_SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
```

### 3.2 `src/lib/supabase.ts`

Buat file ini untuk menghubungkan aplikasi ke Supabase:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

---

## Langkah 4: Sistem Routing & Authentication

Menggunakan TanStack Router, struktur file di dalam folder `src/routes/` akan terlihat seperti ini:

1. `__root.tsx` -> Membungkus seluruh aplikasi dengan `<QueryClientProvider>`.
2. `index.tsx` -> Halaman Landing Page (Berisi Headline, "How it Works", dan Call to Action untuk Pitching).
3. `login.tsx` -> Halaman Login (Supabase Auth).
4. `dashboard.tsx` -> Layout utama yang diproteksi. Di sini kita memanggil `supabase.auth.getSession()`. Jika tidak ada session, lempar kembali ke `/login`.
5. `dashboard/warga.tsx` -> Tampilan B2C.
6. `dashboard/corporate.tsx` -> Tampilan B2B.

**Logika Halaman Login (`/login`)**:
Buat form sederhana (Email & Password). Gunakan fungsi Supabase:

```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
})
```

---

## Langkah 5: Implementasi Warga Dashboard (B2C)

Berada di route `dashboard/warga.tsx`.

### 5.1 Fetching Saldo & Daftar Program CSR (TanStack Query)

Gunakan `useQuery` untuk mengambil saldo Warga dan daftar program CSR yang tersedia.

```typescript
const { data: userProfile } = useQuery({
  queryKey: ['userProfile', userId],
  queryFn: async () => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    return data
  },
})

const { data: csrPrograms } = useQuery({
  queryKey: ['csrPrograms'],
  queryFn: async () => {
    const { data } = await supabase
      .from('csr_programs')
      .select('*')
      .eq('is_active', true)
    return data
  },
})
```

// Tampilkan Saldo dalam bentuk "Poin Kebaikan" (bukan Rupiah), misalnya: "Saldo Anda: 25.000 Poin".
// Lalu tampilkan daftar Program CSR dalam bentuk Card. Warga bisa menekan tombol "Kerjakan Tugas" pada salah satu program.

### 5.2 Fitur Tukar Poin (Redeem - Dummy UI)

Tambahkan satu seksi di bawah saldo untuk menukarkan poin dengan kebutuhan pokok (Sembako, Token Listrik, BPJS).
Gunakan komponen Card dari shadcn/ui untuk menampilkan opsi statis:

- 🌾 Paket Sembako (Tukar 50.000 Poin)
- ⚡ Token Listrik PLN (Tukar 20.000 Poin)
- 🏥 Bayar Premi BPJS (Tukar 35.000 Poin)

### 5.3 Form Submit Tugas & Upload Foto

Buat form menggunakan komponen shadcn/ui. Form ini akan mengirimkan `program_id` berdasarkan program CSR yang dipilih.
Opsi `task_type` yang valid (gunakan komponen `Select`):

- Membersihkan Lingkungan
- Mengajar
- Daur Ulang
- Pelatihan
- Pengembangan (kerajinan dan sebagainya)
- Konstruksi (bikin sumur, bikin jalur, bikin irigasi)
- Relawan bencana

**Logika Upload Foto:**
Saat user klik submit form (memilih file gambar):

```typescript
// 1. Upload ke Storage
const fileExt = file.name.split('.').pop()
const fileName = `${Math.random()}.${fileExt}`
const { data: uploadData } = await supabase.storage
  .from('task-photos')
  .upload(fileName, file)

// Dapatkan Public URL
const { data: publicUrlData } = supabase.storage
  .from('task-photos')
  .getPublicUrl(fileName)

// 2. Insert Data Task ke Database
const { error } = await supabase.from('tasks').insert({
  warga_id: session.user.id,
  program_id: selectedProgramId,
  task_type: selectedTask,
  hours_spent: hoursInput,
  photo_url: publicUrlData.publicUrl,
  status: 'pending', // Akan diproses oleh otomasi
})
```

Gunakan TanStack Query `useMutation` untuk memutar status _loading_ form.

---

## Langkah 6: Simulasi Otomasi Backend (Webhook)

Sesuai "Golden Flow" untuk menggantikan n8n/Make.com, buat endpoint di `src/routes/api/trigger-automation.ts`.

API Route ini melakukan transaksi:

1. `SELECT * FROM tasks WHERE status = 'pending'`
2. Loop semua tugas pending:
   - Hitung `credit = hours_spent * 25000`
   - Update tabel `tasks`: set status = `approved`, set `credit_earned = credit`
   - Ambil `balance` saat ini dari tabel `users`, lalu tambahkan dengan `credit` (Dianggap sebagai Poin Kebaikan).
   - Ambil `funds_disbursed` dari tabel `csr_programs` spesifik (`program_id`), lalu tambahkan dengan `credit` (Dianggap sebagai nilai Rupiah yang keluar dari perusahaan).

---

## Langkah 7: Implementasi Corporate Dashboard (B2B)

Berada di route `dashboard/corporate.tsx`.

### 7.1 Fetching KPI Metrics

Gunakan `useQuery` untuk mengambil baris data dari `csr_programs` milik perusahaan yang login (untuk MVP, bisa tampilkan semua):

- Tampilkan nama program dan total budget (misal Rp 50.000.000).
- Tampilkan total dana tersalurkan (`funds_disbursed`).
- Sisa budget = budget - disbursed.

### 7.2 Log Aktivitas (Tabel)

Gunakan komponen Table shadcn/ui.
Gunakan `useQuery` untuk join data:

```typescript
const { data: taskLog } = useQuery({
  queryKey: ['corporateTasks'],
  queryFn: async () => {
    // Join dengan tabel users untuk mendapatkan nama
    const { data } = await supabase
      .from('tasks')
      .select(
        `
        id, task_type, hours_spent, status, photo_url, credit_earned, created_at,
        users ( full_name )
      `,
      )
      .order('created_at', { ascending: false })
    return data
  },
})
```

Tampilkan list tugas dari berbagai warga (menunjukkan _impact_ CSR ke korporat).
