ALTER TABLE public.santri
  ADD COLUMN IF NOT EXISTS foto_url text;

COMMENT ON COLUMN public.santri.foto_url IS 'URL foto santri dari Cloudinary untuk kartu santri dan profil.';
