-- Full Supabase schema for Mathlabul Hidayah Nursalam.
-- Use when the Supabase project tables have been deleted.
-- Run in Supabase Dashboard > SQL Editor.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================
-- Tables
-- =========================

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin','guru','user')),
  full_name text NOT NULL,
  phone text,
  email text,
  avatar_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

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

CREATE TABLE IF NOT EXISTS public.jenis_pelanggaran (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  nama text NOT NULL,
  deskripsi text,
  poin_default integer NOT NULL DEFAULT 5,
  kategori text NOT NULL CHECK (kategori IN ('ringan','sedang','berat')),
  is_active boolean DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.kategori_hapalan (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  nama text NOT NULL,
  deskripsi text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.pelanggaran (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  santri_id uuid NOT NULL REFERENCES public.santri(id) ON DELETE CASCADE,
  guru_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  jenis_id uuid REFERENCES public.jenis_pelanggaran(id) ON DELETE SET NULL,
  tanggal date NOT NULL DEFAULT CURRENT_DATE,
  deskripsi text NOT NULL,
  poin integer NOT NULL,
  status text NOT NULL DEFAULT 'aktif' CHECK (status IN ('aktif','ditindaklanjuti')),
  catatan_tindak_lanjut text,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.setoran_hapalan (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  santri_id uuid NOT NULL REFERENCES public.santri(id) ON DELETE CASCADE,
  guru_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  tanggal date NOT NULL DEFAULT CURRENT_DATE,
  jenis text NOT NULL CHECK (jenis IN ('ziyadah','murajaah')),
  surah_nama text NOT NULL,
  surah_nomor integer NOT NULL DEFAULT 1,
  ayat_dari integer NOT NULL,
  ayat_sampai integer NOT NULL,
  jumlah_halaman numeric(6,2) NOT NULL DEFAULT 0,
  nilai text NOT NULL CHECK (nilai IN ('mumtaz','jayyid_jiddan','jayyid','maqbul')),
  catatan text,
  kategori_id uuid REFERENCES public.kategori_hapalan(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.progress_hapalan (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  santri_id uuid UNIQUE NOT NULL REFERENCES public.santri(id) ON DELETE CASCADE,
  total_juz numeric(5,2) DEFAULT 0 NOT NULL,
  total_halaman numeric(7,2) DEFAULT 0 NOT NULL,
  last_surah text,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

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
  bulan text NOT NULL,
  tahun text NOT NULL,
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
  target_value text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =========================
-- Helpers and triggers
-- =========================

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (user_id, role, full_name, phone, email, avatar_url, is_active)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'Pengguna Baru'),
    NEW.raw_user_meta_data->>'phone',
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url',
    true
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;
CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

CREATE OR REPLACE FUNCTION public.notify_wali(
  p_santri_id uuid,
  p_judul text,
  p_pesan text,
  p_tipe text,
  p_ref_id uuid
) RETURNS void AS $$
DECLARE
  v_wali_id uuid;
BEGIN
  SELECT wali_id INTO v_wali_id FROM public.santri WHERE id = p_santri_id;
  IF v_wali_id IS NOT NULL THEN
    INSERT INTO public.notifikasi (user_id, judul, pesan, tipe, ref_id, is_read)
    VALUES (v_wali_id, p_judul, p_pesan, p_tipe, p_ref_id, false);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.trg_fn_pelanggaran_created()
RETURNS trigger AS $$
DECLARE
  v_santri_nama text;
BEGIN
  SELECT nama INTO v_santri_nama FROM public.santri WHERE id = NEW.santri_id;
  PERFORM public.notify_wali(
    NEW.santri_id,
    'Catatan Kedisiplinan Baru',
    'Ada catatan pelanggaran untuk ' || COALESCE(v_santri_nama, 'santri') || ': ' || NEW.deskripsi || ' (' || NEW.poin || ' poin).',
    'pelanggaran',
    NEW.id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_on_pelanggaran_insert ON public.pelanggaran;
CREATE TRIGGER trg_on_pelanggaran_insert
  AFTER INSERT ON public.pelanggaran
  FOR EACH ROW EXECUTE FUNCTION public.trg_fn_pelanggaran_created();

CREATE OR REPLACE FUNCTION public.trg_fn_setoran_hapalan_created()
RETURNS trigger AS $$
DECLARE
  v_santri_nama text;
BEGIN
  SELECT nama INTO v_santri_nama FROM public.santri WHERE id = NEW.santri_id;

  INSERT INTO public.progress_hapalan (santri_id, total_halaman, last_surah, updated_at)
  VALUES (NEW.santri_id, NEW.jumlah_halaman, NEW.surah_nama, now())
  ON CONFLICT (santri_id) DO UPDATE SET
    total_halaman = public.progress_hapalan.total_halaman + NEW.jumlah_halaman,
    total_juz = ROUND(((public.progress_hapalan.total_halaman + NEW.jumlah_halaman) / 20)::numeric, 2),
    last_surah = NEW.surah_nama,
    updated_at = now();

  PERFORM public.notify_wali(
    NEW.santri_id,
    'Setoran Hafalan Baru',
    'Setoran hafalan ' || COALESCE(v_santri_nama, 'santri') || ' telah diinput: ' || NEW.surah_nama || ' ayat ' || NEW.ayat_dari || '-' || NEW.ayat_sampai || '.',
    'hapalan',
    NEW.id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_on_setoran_hapalan_insert ON public.setoran_hapalan;
CREATE TRIGGER trg_on_setoran_hapalan_insert
  AFTER INSERT ON public.setoran_hapalan
  FOR EACH ROW EXECUTE FUNCTION public.trg_fn_setoran_hapalan_created();

CREATE OR REPLACE FUNCTION public.trg_fn_tagihan_created()
RETURNS trigger AS $$
DECLARE
  v_santri_nama text;
  v_pay_name text;
BEGIN
  SELECT nama INTO v_santri_nama FROM public.santri WHERE id = NEW.santri_id;
  SELECT nama INTO v_pay_name FROM public.jenis_pembayaran WHERE id = NEW.jenis_id;
  PERFORM public.notify_wali(
    NEW.santri_id,
    'Tagihan Baru Tersedia',
    'Tagihan ' || COALESCE(v_pay_name, 'iuran') || ' bulan ' || NEW.bulan || ' ' || NEW.tahun || ' sebesar Rp ' || to_char(NEW.nominal, 'FM999G999G999') || ' telah tersedia untuk ' || COALESCE(v_santri_nama, 'santri') || '.',
    'tagihan',
    NEW.id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_on_tagihan_insert ON public.tagihan;
CREATE TRIGGER trg_on_tagihan_insert
  AFTER INSERT ON public.tagihan
  FOR EACH ROW EXECUTE FUNCTION public.trg_fn_tagihan_created();

CREATE OR REPLACE FUNCTION public.trg_fn_pembayaran_status_change()
RETURNS trigger AS $$
DECLARE
  v_santri_id uuid;
  v_bulan text;
  v_tahun text;
  v_pay_name text;
BEGIN
  IF NEW.status = 'lunas' AND OLD.status IS DISTINCT FROM NEW.status THEN
    SELECT t.santri_id, t.bulan, t.tahun, jp.nama
    INTO v_santri_id, v_bulan, v_tahun, v_pay_name
    FROM public.tagihan t
    JOIN public.jenis_pembayaran jp ON jp.id = t.jenis_id
    WHERE t.id = NEW.tagihan_id;

    UPDATE public.tagihan SET status = 'lunas' WHERE id = NEW.tagihan_id;

    IF v_santri_id IS NOT NULL THEN
      PERFORM public.notify_wali(
        v_santri_id,
        'Pembayaran Berhasil',
        'Pembayaran tagihan ' || COALESCE(v_pay_name, 'iuran') || ' ' || COALESCE(v_bulan, '') || '/' || COALESCE(v_tahun, '') || ' sebesar Rp ' || to_char(NEW.nominal, 'FM999G999G999') || ' telah sukses dikonfirmasi LUNAS.',
        'pembayaran',
        NEW.id
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_on_pembayaran_update ON public.pembayaran;
CREATE TRIGGER trg_on_pembayaran_update
  AFTER UPDATE OF status ON public.pembayaran
  FOR EACH ROW EXECUTE FUNCTION public.trg_fn_pembayaran_status_change();

-- =========================
-- RLS
-- =========================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.santri ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jenis_pelanggaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kategori_hapalan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pelanggaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.setoran_hapalan ENABLE ROW LEVEL SECURITY;
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

DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;
END $$;

CREATE POLICY "Profiles are readable by authenticated" ON public.profiles FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage profiles" ON public.profiles FOR ALL USING (public.get_user_role() = 'admin') WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "Santri readable by role" ON public.santri FOR SELECT USING (
  public.get_user_role() IN ('admin','guru') OR wali_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);
CREATE POLICY "Admins manage santri" ON public.santri FOR ALL USING (public.get_user_role() = 'admin') WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "Jenis pelanggaran readable" ON public.jenis_pelanggaran FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins manage jenis pelanggaran" ON public.jenis_pelanggaran FOR ALL USING (public.get_user_role() = 'admin') WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "Kategori hapalan readable" ON public.kategori_hapalan FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins manage kategori hapalan" ON public.kategori_hapalan FOR ALL USING (public.get_user_role() = 'admin') WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "Pelanggaran readable by role" ON public.pelanggaran FOR SELECT USING (
  public.get_user_role() IN ('admin','guru') OR santri_id IN (
    SELECT s.id FROM public.santri s JOIN public.profiles p ON p.id = s.wali_id WHERE p.user_id = auth.uid()
  )
);
CREATE POLICY "Guru inserts pelanggaran" ON public.pelanggaran FOR INSERT WITH CHECK (
  public.get_user_role() IN ('admin','guru')
);
CREATE POLICY "Guru/admin manage pelanggaran" ON public.pelanggaran FOR UPDATE USING (
  public.get_user_role() = 'admin' OR guru_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
) WITH CHECK (
  public.get_user_role() = 'admin' OR guru_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);
CREATE POLICY "Admins delete pelanggaran" ON public.pelanggaran FOR DELETE USING (public.get_user_role() = 'admin');

CREATE POLICY "Setoran readable by role" ON public.setoran_hapalan FOR SELECT USING (
  public.get_user_role() IN ('admin','guru') OR santri_id IN (
    SELECT s.id FROM public.santri s JOIN public.profiles p ON p.id = s.wali_id WHERE p.user_id = auth.uid()
  )
);
CREATE POLICY "Guru inserts setoran" ON public.setoran_hapalan FOR INSERT WITH CHECK (
  public.get_user_role() IN ('admin','guru')
);
CREATE POLICY "Guru/admin manage setoran" ON public.setoran_hapalan FOR UPDATE USING (
  public.get_user_role() = 'admin' OR guru_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
) WITH CHECK (
  public.get_user_role() = 'admin' OR guru_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);
CREATE POLICY "Admins delete setoran" ON public.setoran_hapalan FOR DELETE USING (public.get_user_role() = 'admin');

CREATE POLICY "Progress readable by role" ON public.progress_hapalan FOR SELECT USING (
  public.get_user_role() IN ('admin','guru') OR santri_id IN (
    SELECT s.id FROM public.santri s JOIN public.profiles p ON p.id = s.wali_id WHERE p.user_id = auth.uid()
  )
);
CREATE POLICY "Admins manage progress" ON public.progress_hapalan FOR ALL USING (public.get_user_role() = 'admin') WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "Public profil readable" ON public.profil_pesantren FOR SELECT USING (true);
CREATE POLICY "Admins manage profil" ON public.profil_pesantren FOR ALL USING (public.get_user_role() = 'admin') WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "Program readable" ON public.program FOR SELECT USING (true);
CREATE POLICY "Admins manage program" ON public.program FOR ALL USING (public.get_user_role() = 'admin') WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "Berita readable" ON public.berita FOR SELECT USING (is_published = true OR public.get_user_role() = 'admin');
CREATE POLICY "Admins manage berita" ON public.berita FOR ALL USING (public.get_user_role() = 'admin') WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "PSB readable" ON public.psb FOR SELECT USING (true);
CREATE POLICY "Admins manage psb" ON public.psb FOR ALL USING (public.get_user_role() = 'admin') WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "Jenis pembayaran readable" ON public.jenis_pembayaran FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins manage jenis pembayaran" ON public.jenis_pembayaran FOR ALL USING (public.get_user_role() = 'admin') WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "Nominal pembayaran readable" ON public.nominal_pembayaran FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins manage nominal pembayaran" ON public.nominal_pembayaran FOR ALL USING (public.get_user_role() = 'admin') WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "Tagihan readable by role" ON public.tagihan FOR SELECT USING (
  public.get_user_role() = 'admin' OR santri_id IN (
    SELECT s.id FROM public.santri s JOIN public.profiles p ON p.id = s.wali_id WHERE p.user_id = auth.uid()
  )
);
CREATE POLICY "Admins manage tagihan" ON public.tagihan FOR ALL USING (public.get_user_role() = 'admin') WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "Pembayaran readable by role" ON public.pembayaran FOR SELECT USING (
  public.get_user_role() = 'admin' OR tagihan_id IN (
    SELECT t.id FROM public.tagihan t JOIN public.santri s ON s.id = t.santri_id JOIN public.profiles p ON p.id = s.wali_id WHERE p.user_id = auth.uid()
  )
);
CREATE POLICY "Wali inserts pembayaran" ON public.pembayaran FOR INSERT WITH CHECK (
  public.get_user_role() = 'user' AND tagihan_id IN (
    SELECT t.id FROM public.tagihan t JOIN public.santri s ON s.id = t.santri_id JOIN public.profiles p ON p.id = s.wali_id WHERE p.user_id = auth.uid()
  )
);
CREATE POLICY "Admins manage pembayaran" ON public.pembayaran FOR ALL USING (public.get_user_role() = 'admin') WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "Notifikasi readable own" ON public.notifikasi FOR SELECT USING (
  user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR public.get_user_role() = 'admin'
);
CREATE POLICY "Notifikasi update own" ON public.notifikasi FOR UPDATE USING (
  user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR public.get_user_role() = 'admin'
) WITH CHECK (
  user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR public.get_user_role() = 'admin'
);
CREATE POLICY "Admins manage notifikasi" ON public.notifikasi FOR ALL USING (public.get_user_role() = 'admin') WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "Pengumuman readable authenticated" ON public.pengumuman FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins manage pengumuman" ON public.pengumuman FOR ALL USING (public.get_user_role() = 'admin') WITH CHECK (public.get_user_role() = 'admin');

-- =========================
-- Starter master data
-- =========================

INSERT INTO public.profil_pesantren (
  nama, tagline, deskripsi, visi, misi, alamat, telepon, email,
  stats_santri_val, stats_santri_lbl, stats_halaqah_val, stats_halaqah_lbl,
  stats_spp_val, stats_spp_lbl, stats_satisfaction_val, stats_satisfaction_lbl
)
SELECT
  'Pondok Pesantren Mathlabul Hidayah Nursalam',
  'Tarbiyah Qur''ani Modern & Salafiyah',
  'Portal digital resmi Pondok Pesantren Mathlabul Hidayah Nursalam.',
  'Mewujudkan generasi Qur''ani, beradab, dan siap berkhidmat.',
  'Menyelenggarakan pendidikan pesantren terpadu, pembinaan akhlak, dan penguatan hafalan.',
  'Indramayu, Jawa Barat',
  '',
  '',
  '0',
  'Santri',
  '0',
  'Halaqah',
  'Aktif',
  'Keuangan',
  '100%',
  'Transparansi'
WHERE NOT EXISTS (SELECT 1 FROM public.profil_pesantren);

INSERT INTO public.kategori_hapalan (nama, deskripsi, is_active)
SELECT 'Al-Qur''an', 'Program hafalan Al-Qur''an santri.', true
WHERE NOT EXISTS (SELECT 1 FROM public.kategori_hapalan WHERE lower(nama) = lower('Al-Qur''an'));

INSERT INTO public.jenis_pelanggaran (nama, deskripsi, poin_default, kategori, is_active)
SELECT * FROM (VALUES
  ('Terlambat Berjamaah', 'Santri terlambat mengikuti shalat berjamaah.', 5, 'ringan', true),
  ('Tidak Mengikuti Kegiatan', 'Santri tidak mengikuti kegiatan wajib tanpa izin.', 10, 'sedang', true),
  ('Pelanggaran Berat', 'Pelanggaran tata tertib kategori berat.', 25, 'berat', true)
) AS v(nama, deskripsi, poin_default, kategori, is_active)
WHERE NOT EXISTS (SELECT 1 FROM public.jenis_pelanggaran);

INSERT INTO public.jenis_pembayaran (nama, deskripsi, is_active)
SELECT * FROM (VALUES
  ('SPP Syahriyah', 'Iuran bulanan operasional pembinaan asrama dan pendidikan.', true),
  ('Uang Buku & Kitab', 'Pembayaran kebutuhan buku dan kitab santri.', true),
  ('Iuran Sarana Prasarana', 'Iuran pengembangan sarana pesantren.', true)
) AS v(nama, deskripsi, is_active)
WHERE NOT EXISTS (SELECT 1 FROM public.jenis_pembayaran);

INSERT INTO public.program (nama, deskripsi, icon, urutan, is_active)
SELECT * FROM (VALUES
  ('Tahfidzul Qur''an', 'Bimbingan hafalan Al-Qur''an terstruktur.', 'BookOpen', 1, true),
  ('Kajian Kitab', 'Pembelajaran kitab turats dan dasar-dasar keislaman.', 'GraduationCap', 2, true),
  ('Pembinaan Akhlak', 'Pembiasaan adab dan kedisiplinan santri.', 'ShieldCheck', 3, true)
) AS v(nama, deskripsi, icon, urutan, is_active)
WHERE NOT EXISTS (SELECT 1 FROM public.program);

INSERT INTO public.psb (tahun_ajaran, tanggal_buka, tanggal_tutup, kuota, syarat, alur_pendaftaran, biaya, is_open)
SELECT
  '2026/2027',
  '2026-01-01',
  '2026-06-30',
  120,
  'Lengkapi data diri, berkas administrasi, dan mengikuti seleksi.',
  'Daftar akun, isi formulir, verifikasi, seleksi, pengumuman.',
  0,
  true
WHERE NOT EXISTS (SELECT 1 FROM public.psb);

INSERT INTO public.berita (judul, slug, konten, penulis, tanggal_publish, is_published)
SELECT
  'Portal Pesantren Siap Digunakan',
  'portal-pesantren-siap-digunakan',
  'Sistem informasi pesantren telah aktif untuk mendukung layanan akademik dan keuangan.',
  'Admin Pesantren',
  CURRENT_DATE,
  true
WHERE NOT EXISTS (SELECT 1 FROM public.berita WHERE slug = 'portal-pesantren-siap-digunakan');

