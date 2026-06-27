-- Manual transfer proof payment mode migration.
-- Run this once on an existing Supabase project before enabling manual proof payments.

ALTER TABLE public.pembayaran
  ADD COLUMN IF NOT EXISTS bukti_url text,
  ADD COLUMN IF NOT EXISTS catatan text,
  ADD COLUMN IF NOT EXISTS verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS verified_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.payment_config (
  id text PRIMARY KEY DEFAULT 'default',
  metode_aktif text NOT NULL DEFAULT 'midtrans' CHECK (metode_aktif IN ('midtrans','manual_transfer')),
  bank_name text,
  account_number text,
  account_name text,
  instructions text,
  is_active boolean DEFAULT true,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.payment_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Payment config readable" ON public.payment_config;
DROP POLICY IF EXISTS "Payment config readable by authenticated" ON public.payment_config;
DROP POLICY IF EXISTS "Admins manage payment config" ON public.payment_config;
DROP POLICY IF EXISTS "Payment config managed by admin only" ON public.payment_config;

CREATE POLICY "Payment config readable" ON public.payment_config
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins manage payment config" ON public.payment_config
  FOR ALL USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

INSERT INTO public.payment_config (id, metode_aktif, bank_name, account_number, account_name, instructions, is_active)
VALUES (
  'default',
  'midtrans',
  'Bank Syariah Indonesia',
  '',
  'Ponpes Mathlabul Hidayah Nursalam',
  'Transfer sesuai nominal tagihan, lalu unggah bukti pembayaran dari Portal Wali.',
  true
)
ON CONFLICT (id) DO NOTHING;
