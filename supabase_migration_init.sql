-- ==========================================
-- 1. EXTENSIONS & PREREQUISITES
-- ==========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 2. SCHEMAS & TABLES DEFINITION
-- ==========================================

-- A. Profiles (Users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  role text NOT NULL CHECK (role IN ('admin','guru','user')),
  full_name text NOT NULL,
  phone text,
  email text,
  avatar_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- B. Data Santri
CREATE TABLE IF NOT EXISTS public.santri (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  nis text UNIQUE NOT NULL,
  nama text NOT NULL,
  kelas text NOT NULL,
  kamar text,
  jenis_kelamin text NOT NULL CHECK (jenis_kelamin IN ('L','P')),
  tanggal_lahir date NOT NULL,
  alamat text,
  wali_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  foto_url text,
  status text NOT NULL DEFAULT 'aktif' CHECK (status IN ('aktif','alumni','keluar')),
  tahun_masuk text NOT NULL,
  bulan_masuk text,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- C. Pelanggaran Master & Records
CREATE TABLE IF NOT EXISTS public.jenis_pelanggaran (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  nama text NOT NULL,
  deskripsi text,
  poin_default integer NOT NULL DEFAULT 5,
  kategori text NOT NULL CHECK (kategori IN ('ringan','sedang','berat')),
  is_active boolean DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.pelanggaran (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  santri_id uuid NOT NULL REFERENCES public.santri(id) ON DELETE CASCADE,
  guru_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  jenis_id uuid REFERENCES public.jenis_pelanggaran(id) ON DELETE SET NULL,
  tanggal date NOT NULL DEFAULT CURRENT_DATE,
  deskripsi text NOT NULL,
  poin integer NOT NULL,
  status text NOT NULL DEFAULT 'aktif' CHECK (status IN ('aktif','ditindaklanjuti')),
  catatan_tindak_lanjut text,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- D. Setoran Hapalan & Progress
CREATE TABLE IF NOT EXISTS public.setoran_hapalan (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  santri_id uuid NOT NULL REFERENCES public.santri(id) ON DELETE CASCADE,
  guru_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  tanggal date NOT NULL DEFAULT CURRENT_DATE,
  jenis text NOT NULL CHECK (jenis IN ('ziyadah','murajaah')),
  surah_nama text NOT NULL,
  surah_nomor integer NOT NULL,
  ayat_dari integer NOT NULL,
  ayat_sampai integer NOT NULL,
  jumlah_halaman numeric(5,2) NOT NULL DEFAULT 0,
  nilai text NOT NULL CHECK (nilai IN ('mumtaz','jayyid_jiddan','jayyid','maqbul')),
  catatan text,
  kategori_id uuid,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.kategori_hapalan (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  nama text NOT NULL,
  deskripsi text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.santri ADD COLUMN IF NOT EXISTS bulan_masuk text;
ALTER TABLE public.setoran_hapalan ADD COLUMN IF NOT EXISTS kategori_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'setoran_hapalan_kategori_id_fkey'
  ) THEN
    ALTER TABLE public.setoran_hapalan
      ADD CONSTRAINT setoran_hapalan_kategori_id_fkey
      FOREIGN KEY (kategori_id) REFERENCES public.kategori_hapalan(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.progress_hapalan (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  santri_id uuid UNIQUE NOT NULL REFERENCES public.santri(id) ON DELETE CASCADE,
  total_juz numeric(4,2) DEFAULT 0 NOT NULL,
  total_halaman numeric(6,2) DEFAULT 0 NOT NULL,
  last_surah text,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.profil_pesantren ADD COLUMN IF NOT EXISTS hero_bg_color text;
ALTER TABLE public.profil_pesantren ADD COLUMN IF NOT EXISTS hero_img_url text;
ALTER TABLE public.profil_pesantren ADD COLUMN IF NOT EXISTS hero_img_opacity numeric(4,2);
ALTER TABLE public.profil_pesantren ADD COLUMN IF NOT EXISTS hero_type text;
ALTER TABLE public.profil_pesantren ADD COLUMN IF NOT EXISTS stats_santri_val text;
ALTER TABLE public.profil_pesantren ADD COLUMN IF NOT EXISTS stats_santri_lbl text;
ALTER TABLE public.profil_pesantren ADD COLUMN IF NOT EXISTS stats_halaqah_val text;
ALTER TABLE public.profil_pesantren ADD COLUMN IF NOT EXISTS stats_halaqah_lbl text;
ALTER TABLE public.profil_pesantren ADD COLUMN IF NOT EXISTS stats_spp_val text;
ALTER TABLE public.profil_pesantren ADD COLUMN IF NOT EXISTS stats_spp_lbl text;
ALTER TABLE public.profil_pesantren ADD COLUMN IF NOT EXISTS stats_satisfaction_val text;
ALTER TABLE public.profil_pesantren ADD COLUMN IF NOT EXISTS stats_satisfaction_lbl text;
ALTER TABLE public.profil_pesantren ADD COLUMN IF NOT EXISTS sejarah_sub text;
ALTER TABLE public.profil_pesantren ADD COLUMN IF NOT EXISTS sejarah_title text;
ALTER TABLE public.profil_pesantren ADD COLUMN IF NOT EXISTS routines_json text;
ALTER TABLE public.profil_pesantren ADD COLUMN IF NOT EXISTS facilities_json text;
ALTER TABLE public.profil_pesantren ADD COLUMN IF NOT EXISTS testimonials_json text;

-- E. Konten Publik (CMS)
CREATE TABLE IF NOT EXISTS public.profil_pesantren (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  nama text NOT NULL DEFAULT 'Pondok Pesantren Mathlabul Hidayah Nursalam',
  tagline text,
  deskripsi text,
  sejarah text,
  visi text,
  misi text,
  alamat text,
  telepon text,
  email text,
  foto_url text,
  hero_bg_color text,
  hero_img_url text,
  hero_img_opacity numeric(4,2),
  hero_type text CHECK (hero_type IS NULL OR hero_type IN ('statis','dinamis')),
  stats_santri_val text,
  stats_santri_lbl text,
  stats_halaqah_val text,
  stats_halaqah_lbl text,
  stats_spp_val text,
  stats_spp_lbl text,
  stats_satisfaction_val text,
  stats_satisfaction_lbl text,
  sejarah_sub text,
  sejarah_title text,
  routines_json text,
  facilities_json text,
  testimonials_json text,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.program (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  nama text NOT NULL,
  deskripsi text NOT NULL,
  icon text NOT NULL DEFAULT 'BookOpen',
  urutan integer NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.berita (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  judul text NOT NULL,
  slug text UNIQUE NOT NULL,
  konten text NOT NULL,
  thumbnail_url text,
  penulis text NOT NULL,
  tanggal_publish date NOT NULL DEFAULT CURRENT_DATE,
  is_published boolean DEFAULT false,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.psb (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tahun_ajaran text NOT NULL,
  tanggal_buka date NOT NULL,
  tanggal_tutup date NOT NULL,
  kuota integer NOT NULL DEFAULT 100,
  syarat text NOT NULL,
  alur_pendaftaran text NOT NULL,
  biaya numeric(12,2) NOT NULL DEFAULT 0,
  is_open boolean DEFAULT false,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- F. Pembayaran (Billing)
CREATE TABLE IF NOT EXISTS public.jenis_pembayaran (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  nama text NOT NULL,
  deskripsi text,
  is_active boolean DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.nominal_pembayaran (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  jenis_id uuid NOT NULL REFERENCES public.jenis_pembayaran(id) ON DELETE CASCADE,
  kelas text NOT NULL,
  nominal numeric(12,2) NOT NULL DEFAULT 0,
  tahun_ajaran text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.tagihan (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  santri_id uuid NOT NULL REFERENCES public.santri(id) ON DELETE CASCADE,
  jenis_id uuid NOT NULL REFERENCES public.jenis_pembayaran(id) ON DELETE RESTRICT,
  bulan text NOT NULL, -- e.g., 'Januari', 'Februari', etc.
  tahun text NOT NULL, -- e.g., '2026'
  nominal numeric(12,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','lunas','gagal')),
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.pembayaran (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tagihan_id uuid NOT NULL REFERENCES public.tagihan(id) ON DELETE RESTRICT,
  order_id text UNIQUE NOT NULL,
  snap_token text,
  metode text,
  nominal numeric(12,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  paid_at timestamptz,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- G. Notifications & Announcements
CREATE TABLE IF NOT EXISTS public.notifikasi (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  judul text NOT NULL,
  pesan text NOT NULL,
  tipe text NOT NULL CHECK (tipe IN ('pelanggaran','hapalan','tagihan','pembayaran','pengumuman')),
  ref_id uuid,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.pengumuman (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  judul text NOT NULL,
  pesan text NOT NULL,
  target text NOT NULL CHECK (target IN ('semua','kelas','santri')),
  target_value text, -- holds 'semua' OR kelas name OR santri_id
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- ==========================================
-- 3. TRIGGERS, FUNCTIONS & BUSINESS LOGIC
-- ==========================================

-- Trigger 1: Auto notification on Pelanggaran insert
CREATE OR REPLACE FUNCTION public.trg_fn_notify_pelanggaran()
RETURNS TRIGGER AS $$
DECLARE
  v_wali_id uuid;
  v_santri_nama text;
  v_pelanggaran_nama text;
BEGIN
  -- Get Wali Santri's profiles ID & Santri's Name
  SELECT wali_id, nama INTO v_wali_id, v_santri_nama FROM public.santri WHERE id = NEW.santri_id;
  
  -- Get Pelanggaran name
  SELECT nama INTO v_pelanggaran_nama FROM public.jenis_pelanggaran WHERE id = NEW.jenis_id;
  IF v_pelanggaran_nama IS NULL THEN
    v_pelanggaran_nama := 'Pelanggaran';
  END IF;

  -- Only send if Wali is defined
  IF v_wali_id IS NOT NULL THEN
    INSERT INTO public.notifikasi (user_id, judul, pesan, tipe, ref_id)
    VALUES (
      v_wali_id,
      'Pelanggaran Tercatat',
      'Ada pelanggaran baru tercatat untuk ' || v_santri_nama || ': ' || v_pelanggaran_nama || ' (' || NEW.poin || ' poin).',
      'pelanggaran',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_on_pelanggaran_insert
  AFTER INSERT ON public.pelanggaran
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_fn_notify_pelanggaran();


-- Trigger 2: Auto notification + progress updates on setoran_hapalan insert
CREATE OR REPLACE FUNCTION public.trg_fn_setoran_hapalan_added()
RETURNS TRIGGER AS $$
DECLARE
  v_wali_id uuid;
  v_santri_nama text;
  v_pages_added numeric(6,2);
  v_juz_gained numeric(4,2);
BEGIN
  -- 1. Get Wali details
  SELECT wali_id, nama INTO v_wali_id, v_santri_nama FROM public.santri WHERE id = NEW.santri_id;
  
  -- 2. Upsert progress_hapalan record for this santri
  v_pages_added := NEW.jumlah_halaman;
  -- Roughly compute juz from pages: 20 pages = 1 juz
  v_juz_gained := v_pages_added / 20.0;

  INSERT INTO public.progress_hapalan (santri_id, total_juz, total_halaman, last_surah, updated_at)
  VALUES (NEW.santri_id, LEAST(v_juz_gained, 30.00), v_pages_added, NEW.surah_nama, timezone('utc'::text, now()))
  ON CONFLICT (santri_id) DO UPDATE SET
    total_juz = LEAST(public.progress_hapalan.total_juz + v_juz_gained, 30.00),
    total_halaman = public.progress_hapalan.total_halaman + v_pages_added,
    last_surah = EXCLUDED.last_surah,
    updated_at = EXCLUDED.updated_at;

  -- 3. Send notification to Wali Santri
  IF v_wali_id IS NOT NULL THEN
    INSERT INTO public.notifikasi (user_id, judul, pesan, tipe, ref_id)
    VALUES (
      v_wali_id,
      'Setoran Hapalan Baru',
      'Setoran hapalan ' || v_santri_nama || ' telah diinput: Surah ' || NEW.surah_nama || ' Ayat ' || NEW.ayat_dari || '-' || NEW.ayat_sampai || ' (' || NEW.nilai || ').',
      'hapalan',
      NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_on_setoran_hapalan_insert
  AFTER INSERT ON public.setoran_hapalan
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_fn_setoran_hapalan_added();


-- Trigger 3: New Tagihan notification for Wali Santri
CREATE OR REPLACE FUNCTION public.trg_fn_notify_tagihan_created()
RETURNS TRIGGER AS $$
DECLARE
  v_wali_id uuid;
  v_santri_nama text;
  v_pembayaran_nama text;
BEGIN
  -- Get Wali details
  SELECT wali_id, nama INTO v_wali_id, v_santri_nama FROM public.santri WHERE id = NEW.santri_id;
  
  -- Get Jenis Pembayaran nama
  SELECT nama INTO v_pembayaran_nama FROM public.jenis_pembayaran WHERE id = NEW.jenis_id;

  IF v_wali_id IS NOT NULL THEN
    INSERT INTO public.notifikasi (user_id, judul, pesan, tipe, ref_id)
    VALUES (
      v_wali_id,
      'Tagihan Baru Tersedia',
      'Tagihan ' || v_pembayaran_nama || ' bulan ' || NEW.bulan || ' ' || NEW.tahun || ' sebesar Rp ' || to_char(NEW.nominal, 'FM999G999G999') || ' telah tersedia untuk ' || v_santri_nama || '.',
      'tagihan',
      NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_on_tagihan_insert
  AFTER INSERT ON public.tagihan
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_fn_notify_tagihan_created();


-- Trigger 4: Handle Payment update (Auto settle Tagihan + Notify Wali)
CREATE OR REPLACE FUNCTION public.trg_fn_pembayaran_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_tagihan_id uuid;
  v_wali_id uuid;
  v_santri_nama text;
  v_pembayaran_nama text;
  v_bulan text;
  v_tahun text;
BEGIN
  -- Check if paid status transitioned to 'lunas'
  IF NEW.status = 'lunas' AND (OLD.status IS NULL OR OLD.status <> 'lunas') THEN
    
    -- 1. Fetch relations info from tagihan
    SELECT t.id, t.santri_id, t.bulan, t.tahun, jp.nama, s.wali_id, s.nama
    INTO v_tagihan_id, NEW.tagihan_id, v_bulan, v_tahun, v_pembayaran_nama, v_wali_id, v_santri_nama
    FROM public.tagihan t
    JOIN public.santri s ON s.id = t.santri_id
    JOIN public.jenis_pembayaran jp ON jp.id = t.jenis_id
    WHERE t.id = NEW.tagihan_id;

    -- 2. Update status tagihan to lunas
    UPDATE public.tagihan SET status = 'lunas' WHERE id = NEW.tagihan_id;

    -- 3. Emit notification
    IF v_wali_id IS NOT NULL THEN
      INSERT INTO public.notifikasi (user_id, judul, pesan, tipe, ref_id)
      VALUES (
        v_wali_id,
        'Pembayaran Berhasil',
        'Pembayaran tagihan ' || v_pembayaran_nama || ' ' || v_bulan || '/' || v_tahun || ' sebesar Rp ' || to_char(NEW.nominal, 'FM999G999G999') || ' telah sukses dikonfirmasi LUNAS.',
        'pembayaran',
        NEW.id
      );
    END IF;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_on_pembayaran_update
  AFTER UPDATE OF status ON public.pembayaran
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_fn_pembayaran_status_change();


-- ==========================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.santri ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jenis_pelanggaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pelanggaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.setoran_hapalan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kategori_hapalan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_hapalan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profil_pesantren ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.berita ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.psb ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jenis_pembayaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nominal_pembayaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tagihan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pembayaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifikasi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pengumuman ENABLE ROW LEVEL SECURITY;

-- Helper security functions
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text AS $$
  -- Checks role of authenticated user from public.profiles matched with auth.uid()
  SELECT role FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- policies for profiles
CREATE POLICY "Profiles are readable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins have full CRUD on profiles" ON public.profiles FOR ALL USING (public.get_user_role() = 'admin');

-- policies for santri
CREATE POLICY "Santri are viewable by assigned wali user, gurus, and admins" ON public.santri FOR SELECT USING (
  public.get_user_role() IN ('admin', 'guru') OR 
  wali_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);
CREATE POLICY "Admins have full CRUD on santri" ON public.santri FOR ALL USING (public.get_user_role() = 'admin');

-- policies for jenis_pelanggaran
CREATE POLICY "Jenis pelanggaran are readable by everyone" ON public.jenis_pelanggaran FOR SELECT USING (true);
CREATE POLICY "Admins have full CRUD on jenis_pelanggaran" ON public.jenis_pelanggaran FOR ALL USING (public.get_user_role() = 'admin');

-- policies for pelanggaran
CREATE POLICY "Pelanggaran are viewable by wali, gurus, and admin" ON public.pelanggaran FOR SELECT USING (
  public.get_user_role() IN ('admin', 'guru') OR 
  santri_id IN (SELECT s.id FROM public.santri s JOIN public.profiles p ON p.id = s.wali_id WHERE p.user_id = auth.uid())
);
CREATE POLICY "Gurus can insert and manage their own pellet records" ON public.pelanggaran FOR ALL USING (
  public.get_user_role() = 'guru' AND (guru_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()))
);
CREATE POLICY "Admins have full CRUD on pelanggaran" ON public.pelanggaran FOR ALL USING (public.get_user_role() = 'admin');

-- policies for setoran_hapalan
CREATE POLICY "Setoran hapalan are viewable by relevant wali, gurus, and admin" ON public.setoran_hapalan FOR SELECT USING (
  public.get_user_role() IN ('admin', 'guru') OR 
  santri_id IN (SELECT s.id FROM public.santri s JOIN public.profiles p ON p.id = s.wali_id WHERE p.user_id = auth.uid())
);
CREATE POLICY "Gurus can insert setoran hapalan" ON public.setoran_hapalan FOR ALL USING (
  public.get_user_role() = 'guru' AND (guru_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()))
);
CREATE POLICY "Admins have full CRUD on setoran_hapalan" ON public.setoran_hapalan FOR ALL USING (public.get_user_role() = 'admin');

CREATE POLICY "Kategori hapalan readable by authenticated" ON public.kategori_hapalan FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Kategori hapalan managed by admin" ON public.kategori_hapalan FOR ALL USING (public.get_user_role() = 'admin');

-- policies for progress_hapalan
CREATE POLICY "Progress hapalan are viewable by relevant wali, gurus, and admin" ON public.progress_hapalan FOR SELECT USING (
  public.get_user_role() IN ('admin', 'guru') OR 
  santri_id IN (SELECT s.id FROM public.santri s JOIN public.profiles p ON p.id = s.wali_id WHERE p.user_id = auth.uid())
);
CREATE POLICY "Gurus & Admins has update/upsert permissions on progress_hapalan" ON public.progress_hapalan FOR ALL USING (
  public.get_user_role() IN ('admin', 'guru')
);

-- policies for public_cms (profil_pesantren, program, berita, psb)
CREATE POLICY "Public items are readable by anyone" ON public.profil_pesantren FOR SELECT USING (true);
CREATE POLICY "Public items are managed by admin only" ON public.profil_pesantren FOR ALL USING (public.get_user_role() = 'admin');

CREATE POLICY "Program are readable by anyone" ON public.program FOR SELECT USING (true);
CREATE POLICY "Program are managed by admin only" ON public.program FOR ALL USING (public.get_user_role() = 'admin');

CREATE POLICY "Berita are readable by anyone" ON public.berita FOR SELECT USING (true);
CREATE POLICY "Berita are managed by admin only" ON public.berita FOR ALL USING (public.get_user_role() = 'admin');

CREATE POLICY "PSB are readable by anyone" ON public.psb FOR SELECT USING (true);
CREATE POLICY "PSB are managed by admin only" ON public.psb FOR ALL USING (public.get_user_role() = 'admin');

-- policies for billing (jenis_pembayaran, nominal_pembayaran, tagihan, pembayaran)
CREATE POLICY "Billing structures readable by everyone authenticated" ON public.jenis_pembayaran FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Billing structures managed by admin only" ON public.jenis_pembayaran FOR ALL USING (public.get_user_role() = 'admin');

CREATE POLICY "Nominal are readable by authenticated" ON public.nominal_pembayaran FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Nominal are managed by admin only" ON public.nominal_pembayaran FOR ALL USING (public.get_user_role() = 'admin');

CREATE POLICY "Tagihan viewable by relevant wali, and admin" ON public.tagihan FOR SELECT USING (
  public.get_user_role() = 'admin' OR 
  santri_id IN (SELECT s.id FROM public.santri s JOIN public.profiles p ON p.id = s.wali_id WHERE p.user_id = auth.uid())
);
CREATE POLICY "Tagihan CRUD by admin" ON public.tagihan FOR ALL USING (public.get_user_role() = 'admin');

CREATE POLICY "Pembayaran viewable by relevant wali, and admin" ON public.pembayaran FOR SELECT USING (
  public.get_user_role() = 'admin' OR 
  tagihan_id IN (SELECT t.id FROM public.tagihan t JOIN public.santri s ON s.id = t.santri_id JOIN public.profiles p ON p.id = s.wali_id WHERE p.user_id = auth.uid())
);
CREATE POLICY "Pembayaran inserted by relevant wali" ON public.pembayaran FOR INSERT WITH CHECK (
  public.get_user_role() = 'user'
);
CREATE POLICY "Pembayaran fully managed by admin" ON public.pembayaran FOR ALL USING (public.get_user_role() = 'admin');

-- policies for notifikasi
CREATE POLICY "Users can only select their own notifications" ON public.notifikasi FOR SELECT USING (
  user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
  public.get_user_role() = 'admin'
);
CREATE POLICY "Users can sign read status on their own notifications" ON public.notifikasi FOR UPDATE USING (
  user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

-- policies for pengumuman
CREATE POLICY "Pengumuman are viewable by everyone authenticated" ON public.pengumuman FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Pengumuman are managed by admin only" ON public.pengumuman FOR ALL USING (public.get_user_role() = 'admin');
