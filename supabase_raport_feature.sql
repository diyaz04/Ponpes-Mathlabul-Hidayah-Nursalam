-- Fitur Raport Santri untuk aplikasi Mathlabul Hidayah Nursalam.
-- Jalankan di Supabase Dashboard > SQL Editor sebelum memakai menu Raport.
-- Catatan: project ini memakai public.profiles.id sebagai user internal, bukan auth.users.id.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.kelas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_kelas text NOT NULL,
  tahun_ajaran text NOT NULL,
  wali_kelas_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.mata_pelajaran (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_pelajaran text NOT NULL,
  kategori text CHECK (kategori IN ('diniyah', 'umum')) DEFAULT 'diniyah',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.kelas_santri (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kelas_id uuid REFERENCES public.kelas(id) ON DELETE CASCADE,
  santri_id uuid REFERENCES public.santri(id) ON DELETE CASCADE,
  semester text CHECK (semester IN ('ganjil', 'genap')) NOT NULL,
  tahun_ajaran text NOT NULL,
  UNIQUE (santri_id, kelas_id, semester, tahun_ajaran)
);

CREATE TABLE IF NOT EXISTS public.kelas_mapel (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kelas_id uuid REFERENCES public.kelas(id) ON DELETE CASCADE,
  mapel_id uuid REFERENCES public.mata_pelajaran(id) ON DELETE CASCADE,
  guru_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  UNIQUE (kelas_id, mapel_id)
);

CREATE TABLE IF NOT EXISTS public.nilai_santri (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  santri_id uuid REFERENCES public.santri(id) ON DELETE CASCADE,
  kelas_mapel_id uuid REFERENCES public.kelas_mapel(id) ON DELETE CASCADE,
  semester text CHECK (semester IN ('ganjil', 'genap')) NOT NULL,
  tahun_ajaran text NOT NULL,
  nilai_harian numeric(5,2) CHECK (nilai_harian BETWEEN 0 AND 100),
  nilai_uas numeric(5,2) CHECK (nilai_uas BETWEEN 0 AND 100),
  nilai_akhir numeric(5,2) GENERATED ALWAYS AS (ROUND((COALESCE(nilai_harian, 0) * 0.6) + (COALESCE(nilai_uas, 0) * 0.4), 2)) STORED,
  catatan_guru text,
  UNIQUE (santri_id, kelas_mapel_id, semester, tahun_ajaran)
);

CREATE TABLE IF NOT EXISTS public.raport (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  santri_id uuid REFERENCES public.santri(id) ON DELETE CASCADE,
  kelas_id uuid REFERENCES public.kelas(id) ON DELETE CASCADE,
  semester text CHECK (semester IN ('ganjil', 'genap')) NOT NULL,
  tahun_ajaran text NOT NULL,
  catatan_wali_kelas text,
  status text CHECK (status IN ('draft', 'published')) DEFAULT 'draft',
  published_at timestamptz,
  UNIQUE (santri_id, kelas_id, semester, tahun_ajaran)
);

CREATE OR REPLACE FUNCTION public.prevent_update_nilai_published()
RETURNS trigger AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.raport r
    JOIN public.kelas_mapel km ON km.id = NEW.kelas_mapel_id
    WHERE r.santri_id = NEW.santri_id
      AND r.kelas_id = km.kelas_id
      AND r.semester = NEW.semester
      AND r.tahun_ajaran = NEW.tahun_ajaran
      AND r.status = 'published'
  ) THEN
    RAISE EXCEPTION 'Nilai sudah terkunci karena raport telah dipublish.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_prevent_update_nilai_published ON public.nilai_santri;
CREATE TRIGGER trg_prevent_update_nilai_published
  BEFORE INSERT OR UPDATE ON public.nilai_santri
  FOR EACH ROW EXECUTE FUNCTION public.prevent_update_nilai_published();

CREATE OR REPLACE FUNCTION public.current_profile_id()
RETURNS uuid AS $$
  SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

ALTER TABLE public.kelas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mata_pelajaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kelas_santri ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kelas_mapel ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nilai_santri ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raport ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Raport kelas readable" ON public.kelas;
DROP POLICY IF EXISTS "Raport kelas admin manage" ON public.kelas;
DROP POLICY IF EXISTS "Mapel readable" ON public.mata_pelajaran;
DROP POLICY IF EXISTS "Mapel admin manage" ON public.mata_pelajaran;
DROP POLICY IF EXISTS "Kelas santri readable by role" ON public.kelas_santri;
DROP POLICY IF EXISTS "Kelas santri admin manage" ON public.kelas_santri;
DROP POLICY IF EXISTS "Kelas mapel readable by role" ON public.kelas_mapel;
DROP POLICY IF EXISTS "Kelas mapel admin manage" ON public.kelas_mapel;
DROP POLICY IF EXISTS "Nilai readable by role" ON public.nilai_santri;
DROP POLICY IF EXISTS "Admin manage nilai" ON public.nilai_santri;
DROP POLICY IF EXISTS "Guru inserts nilai ampuan" ON public.nilai_santri;
DROP POLICY IF EXISTS "Guru updates nilai ampuan unlocked" ON public.nilai_santri;
DROP POLICY IF EXISTS "Raport readable by role" ON public.raport;
DROP POLICY IF EXISTS "Admin manage raport" ON public.raport;
DROP POLICY IF EXISTS "Admin creates raport" ON public.raport;
DROP POLICY IF EXISTS "Wali kelas publishes raport" ON public.raport;

CREATE POLICY "Raport kelas readable" ON public.kelas FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Raport kelas admin manage" ON public.kelas FOR ALL
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "Mapel readable" ON public.mata_pelajaran FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Mapel admin manage" ON public.mata_pelajaran FOR ALL
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "Kelas santri readable by role" ON public.kelas_santri FOR SELECT USING (
  public.get_user_role() IN ('admin','guru') OR santri_id IN (
    SELECT s.id FROM public.santri s JOIN public.profiles p ON p.id = s.wali_id WHERE p.user_id = auth.uid()
  )
);
CREATE POLICY "Kelas santri admin manage" ON public.kelas_santri FOR ALL
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "Kelas mapel readable by role" ON public.kelas_mapel FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Kelas mapel admin manage" ON public.kelas_mapel FOR ALL
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "Nilai readable by role" ON public.nilai_santri FOR SELECT USING (
  public.get_user_role() IN ('admin','guru') OR santri_id IN (
    SELECT s.id FROM public.santri s JOIN public.profiles p ON p.id = s.wali_id WHERE p.user_id = auth.uid()
  )
);
CREATE POLICY "Admin manage nilai" ON public.nilai_santri FOR ALL
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');
CREATE POLICY "Guru inserts nilai ampuan" ON public.nilai_santri FOR INSERT WITH CHECK (
  public.get_user_role() = 'admin' OR EXISTS (
    SELECT 1 FROM public.kelas_mapel km
    WHERE km.id = kelas_mapel_id AND km.guru_id = public.current_profile_id()
  )
);
CREATE POLICY "Guru updates nilai ampuan unlocked" ON public.nilai_santri FOR UPDATE USING (
  public.get_user_role() = 'admin' OR EXISTS (
    SELECT 1 FROM public.kelas_mapel km
    WHERE km.id = kelas_mapel_id AND km.guru_id = public.current_profile_id()
  )
) WITH CHECK (
  public.get_user_role() = 'admin' OR EXISTS (
    SELECT 1 FROM public.kelas_mapel km
    WHERE km.id = kelas_mapel_id AND km.guru_id = public.current_profile_id()
  )
);

CREATE POLICY "Raport readable by role" ON public.raport FOR SELECT USING (
  public.get_user_role() IN ('admin','guru') OR (
    status = 'published' AND santri_id IN (
      SELECT s.id FROM public.santri s JOIN public.profiles p ON p.id = s.wali_id WHERE p.user_id = auth.uid()
    )
  )
);
CREATE POLICY "Admin manage raport" ON public.raport FOR ALL
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');
CREATE POLICY "Admin creates raport" ON public.raport FOR INSERT
  WITH CHECK (public.get_user_role() = 'admin');
CREATE POLICY "Wali kelas publishes raport" ON public.raport FOR UPDATE USING (
  public.get_user_role() = 'admin' OR EXISTS (
    SELECT 1 FROM public.kelas k
    WHERE k.id = kelas_id AND k.wali_kelas_id = public.current_profile_id()
  )
) WITH CHECK (
  public.get_user_role() = 'admin' OR EXISTS (
    SELECT 1 FROM public.kelas k
    WHERE k.id = kelas_id AND k.wali_kelas_id = public.current_profile_id()
  )
);
