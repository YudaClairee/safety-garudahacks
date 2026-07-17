-- 1. Buat Tabel Pengguna Ekstensi (Warga / Corporate)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'warga', -- 'warga' atau 'corporate'
  points INTEGER DEFAULT 0,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mengaktifkan RLS (Row Level Security) untuk Users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone." ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile." ON public.users FOR UPDATE USING (auth.uid() = id);

-- Trigger Otomatis: Setiap kali ada User baru mendaftar di Auth, masukkan datanya ke tabel public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, role, points)
  VALUES (new.id, new.email, 'warga', 0);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 2. Buat Tabel Tugas (Tasks)
CREATE TABLE public.tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) NOT NULL,
  type TEXT NOT NULL, -- e.g., 'Pelatihan', 'Konstruksi', 'Mengajar', dll.
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  photo_url TEXT NOT NULL,
  company_name TEXT DEFAULT '',
  location TEXT,
  description TEXT,
  reward_type TEXT,
  reward_value NUMERIC,
  latitude NUMERIC,
  longitude NUMERIC,
  captured_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mengaktifkan RLS untuk Tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tasks are viewable by everyone." ON public.tasks FOR SELECT USING (true);
CREATE POLICY "Users can insert their own tasks." ON public.tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
-- (Untuk Hackathon, kita biarkan UPDATE bisa dilakukan siapa saja demi webhook, atau gunakan Service Role Key di webhook)
CREATE POLICY "Tasks can be updated by anyone (Hackathon MVP)" ON public.tasks FOR UPDATE USING (true);

-- 3. Buat Tabel Program CSR Corporate
CREATE TABLE public.csr_programs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id),
  company_name TEXT NOT NULL,
  budget_rupiah NUMERIC NOT NULL DEFAULT 0,
  tasks_funded INTEGER NOT NULL DEFAULT 0,
  focus_category TEXT,
  location TEXT,
  reward_type TEXT NOT NULL DEFAULT 'Voucher Sembako',
  reward_value NUMERIC NOT NULL DEFAULT 50000,
  reward_points INTEGER NOT NULL DEFAULT 1000,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3b. Riwayat Penukaran Reward Internal (Hackathon MVP)
CREATE TABLE public.reward_redemptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) NOT NULL,
  reward_name TEXT NOT NULL,
  reward_type TEXT NOT NULL,
  reward_value NUMERIC NOT NULL,
  points_cost INTEGER NOT NULL,
  voucher_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'issued',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Redemptions are viewable by everyone." ON public.reward_redemptions FOR SELECT USING (true);
CREATE POLICY "Users can insert their own redemptions." ON public.reward_redemptions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3c. Tabel Pendaftaran Program CSR oleh Warga (Baru)
CREATE TABLE public.program_registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) NOT NULL,
  program_id UUID REFERENCES public.csr_programs(id) ON DELETE CASCADE NOT NULL,
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, program_id)
);

ALTER TABLE public.program_registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Registrations are viewable by everyone." ON public.program_registrations FOR SELECT USING (true);
CREATE POLICY "Users can register themselves." ON public.program_registrations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can cancel their registration." ON public.program_registrations FOR DELETE USING (auth.uid() = user_id);

-- Mengaktifkan RLS untuk CSR Programs
ALTER TABLE public.csr_programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "CSR Programs are viewable by everyone." ON public.csr_programs FOR SELECT USING (true);
CREATE POLICY "CSR Programs can be updated by anyone (Hackathon MVP)" ON public.csr_programs FOR UPDATE USING (true);
CREATE POLICY "CSR Programs can be inserted by anyone (Hackathon MVP)" ON public.csr_programs FOR INSERT WITH CHECK (true);

-- 4. Dummy Data Perusahaan CSR
INSERT INTO public.csr_programs (company_name, budget_rupiah, tasks_funded)
VALUES 
  ('PT Bangun Bangsa', 50000000, 0),
  ('Bank Kesejahteraan', 100000000, 0);

-- 5. Konfigurasi Bucket Storage untuk Foto
INSERT INTO storage.buckets (id, name, public) VALUES ('task_photos', 'task_photos', true);
CREATE POLICY "Anyone can upload photos (Hackathon MVP)" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'task_photos');
CREATE POLICY "Anyone can view photos" ON storage.objects FOR SELECT USING (bucket_id = 'task_photos');
