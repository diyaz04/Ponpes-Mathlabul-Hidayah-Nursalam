-- Runtime fix for the current Supabase project.
-- Run this in Supabase Dashboard > SQL Editor.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

ALTER TABLE public.kategori_hapalan ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'kategori_hapalan'
      AND policyname = 'Kategori hapalan readable by authenticated'
  ) THEN
    CREATE POLICY "Kategori hapalan readable by authenticated"
      ON public.kategori_hapalan
      FOR SELECT
      USING (auth.uid() IS NOT NULL);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'kategori_hapalan'
      AND policyname = 'Kategori hapalan managed by admin'
  ) THEN
    CREATE POLICY "Kategori hapalan managed by admin"
      ON public.kategori_hapalan
      FOR ALL
      USING (public.get_user_role() = 'admin')
      WITH CHECK (public.get_user_role() = 'admin');
  END IF;
END $$;

INSERT INTO public.kategori_hapalan (nama, deskripsi, is_active)
SELECT 'Al-Qur''an', 'Program hafalan Al-Qur''an santri.', true
WHERE NOT EXISTS (
  SELECT 1 FROM public.kategori_hapalan WHERE lower(nama) = lower('Al-Qur''an')
);

