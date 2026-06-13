ALTER TABLE public.psb
  ADD COLUMN IF NOT EXISTS is_open boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

ALTER TABLE public.psb ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read psb config" ON public.psb;
CREATE POLICY "Public can read psb config"
ON public.psb
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Admin manages psb config" ON public.psb;
CREATE POLICY "Admin manages psb config"
ON public.psb
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
  )
);

CREATE TABLE IF NOT EXISTS public.psb_pendaftar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nomor_pendaftaran text UNIQUE NOT NULL,
  nama_lengkap text NOT NULL,
  nisn text,
  jenis_kelamin text CHECK (jenis_kelamin IN ('L', 'P')) NOT NULL DEFAULT 'L',
  tempat_lahir text,
  tanggal_lahir date,
  jenjang text NOT NULL,
  program_pilihan text,
  asal_sekolah text,
  alamat text,
  nama_ayah text,
  nama_ibu text,
  nama_wali text NOT NULL,
  pekerjaan_wali text,
  no_whatsapp text NOT NULL,
  email text,
  catatan text,
  status text CHECK (status IN ('baru', 'terverifikasi', 'ditolak')) NOT NULL DEFAULT 'baru',
  catatan_admin text,
  verified_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_psb_pendaftar_status ON public.psb_pendaftar(status);
CREATE INDEX IF NOT EXISTS idx_psb_pendaftar_created_at ON public.psb_pendaftar(created_at DESC);

ALTER TABLE public.psb_pendaftar ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can submit psb registration" ON public.psb_pendaftar;
CREATE POLICY "Public can submit psb registration"
ON public.psb_pendaftar
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Admin manages psb registration" ON public.psb_pendaftar;
CREATE POLICY "Admin manages psb registration"
ON public.psb_pendaftar
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
  )
);
