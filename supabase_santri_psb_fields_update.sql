ALTER TABLE public.santri
  ADD COLUMN IF NOT EXISTS desa_kelurahan text,
  ADD COLUMN IF NOT EXISTS kecamatan text,
  ADD COLUMN IF NOT EXISTS kabupaten_kota text,
  ADD COLUMN IF NOT EXISTS provinsi text,
  ADD COLUMN IF NOT EXISTS nik text,
  ADD COLUMN IF NOT EXISTS kk text,
  ADD COLUMN IF NOT EXISTS nama_ayah text,
  ADD COLUMN IF NOT EXISTS nama_ibu text,
  ADD COLUMN IF NOT EXISTS pekerjaan_ayah text,
  ADD COLUMN IF NOT EXISTS pekerjaan_ibu text;

ALTER TABLE public.psb_pendaftar
  ADD COLUMN IF NOT EXISTS nis text,
  ADD COLUMN IF NOT EXISTS kamar text,
  ADD COLUMN IF NOT EXISTS desa_kelurahan text,
  ADD COLUMN IF NOT EXISTS kecamatan text,
  ADD COLUMN IF NOT EXISTS kabupaten_kota text,
  ADD COLUMN IF NOT EXISTS provinsi text,
  ADD COLUMN IF NOT EXISTS bulan_masuk text,
  ADD COLUMN IF NOT EXISTS tahun_masuk text,
  ADD COLUMN IF NOT EXISTS nik text,
  ADD COLUMN IF NOT EXISTS kk text,
  ADD COLUMN IF NOT EXISTS pekerjaan_ayah text,
  ADD COLUMN IF NOT EXISTS pekerjaan_ibu text,
  ADD COLUMN IF NOT EXISTS ktp_ortu_url text,
  ADD COLUMN IF NOT EXISTS kk_url text;
