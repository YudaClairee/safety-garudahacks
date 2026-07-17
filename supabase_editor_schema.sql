-- Supabase SQL Editor schema / migration script
-- Jalankan ini di Supabase SQL Editor untuk menyamakan schema dengan app.

-- 1) Users profile table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'warga',
  points INTEGER NOT NULL DEFAULT 0,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  CREATE POLICY "Public profiles are viewable by everyone."
    ON public.users
    FOR SELECT
    USING (true);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Users can update own profile."
    ON public.users
    FOR UPDATE
    USING (auth.uid() = id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Important for your current issue:
-- if the remote database is missing the full_name column, add it safely.
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Keep profile row in sync when a new auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, role, points)
  VALUES (new.id, new.email, 'warga', 0)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 2) Tasks
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  photo_url TEXT NOT NULL,
  company_name TEXT NOT NULL DEFAULT '',
  location TEXT,
  description TEXT,
  reward_type TEXT,
  reward_value NUMERIC,
  latitude NUMERIC,
  longitude NUMERIC,
  captured_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  CREATE POLICY "Tasks are viewable by everyone."
    ON public.tasks
    FOR SELECT
    USING (true);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Users can insert their own tasks."
    ON public.tasks
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Tasks can be updated by anyone (Hackathon MVP)"
    ON public.tasks
    FOR UPDATE
    USING (true);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 3) CSR programs
CREATE TABLE IF NOT EXISTS public.csr_programs (
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.csr_programs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  CREATE POLICY "CSR Programs are viewable by everyone."
    ON public.csr_programs
    FOR SELECT
    USING (true);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "CSR Programs can be updated by anyone (Hackathon MVP)"
    ON public.csr_programs
    FOR UPDATE
    USING (true);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "CSR Programs can be inserted by anyone (Hackathon MVP)"
    ON public.csr_programs
    FOR INSERT
    WITH CHECK (true);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 4) Reward redemptions
CREATE TABLE IF NOT EXISTS public.reward_redemptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) NOT NULL,
  reward_name TEXT NOT NULL,
  reward_type TEXT NOT NULL,
  reward_value NUMERIC NOT NULL,
  points_cost INTEGER NOT NULL,
  voucher_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'issued',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  CREATE POLICY "Redemptions are viewable by everyone."
    ON public.reward_redemptions
    FOR SELECT
    USING (true);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Users can insert their own redemptions."
    ON public.reward_redemptions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 5) Program registrations
CREATE TABLE IF NOT EXISTS public.program_registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) NOT NULL,
  program_id UUID REFERENCES public.csr_programs(id) ON DELETE CASCADE NOT NULL,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, program_id)
);

ALTER TABLE public.program_registrations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  CREATE POLICY "Registrations are viewable by everyone."
    ON public.program_registrations
    FOR SELECT
    USING (true);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Users can register themselves."
    ON public.program_registrations
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Users can cancel their registration."
    ON public.program_registrations
    FOR DELETE
    USING (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 6) Sample data
INSERT INTO public.csr_programs (company_name, budget_rupiah, tasks_funded)
VALUES
  ('PT Bangun Bangsa', 50000000, 0),
  ('Bank Kesejahteraan', 100000000, 0)
ON CONFLICT DO NOTHING;

-- 7) Storage bucket for task photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('task_photos', 'task_photos', true)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  CREATE POLICY "Anyone can upload photos (Hackathon MVP)"
    ON storage.objects
    FOR INSERT
    WITH CHECK (bucket_id = 'task_photos');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Anyone can view photos"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'task_photos');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
