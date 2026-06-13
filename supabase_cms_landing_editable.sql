ALTER TABLE public.profil_pesantren
  ADD COLUMN IF NOT EXISTS footer_description text,
  ADD COLUMN IF NOT EXISTS footer_copyright text,
  ADD COLUMN IF NOT EXISTS social_links_json text,
  ADD COLUMN IF NOT EXISTS programs_json text,
  ADD COLUMN IF NOT EXISTS faq_json text,
  ADD COLUMN IF NOT EXISTS section_titles_json text;

COMMENT ON COLUMN public.profil_pesantren.footer_description IS 'Deskripsi singkat yang tampil di footer landing page.';
COMMENT ON COLUMN public.profil_pesantren.footer_copyright IS 'Teks copyright footer landing page.';
COMMENT ON COLUMN public.profil_pesantren.social_links_json IS 'JSON array link media sosial: platform, label, url.';
COMMENT ON COLUMN public.profil_pesantren.programs_json IS 'JSON array kartu program unggulan landing page.';
COMMENT ON COLUMN public.profil_pesantren.faq_json IS 'JSON array pertanyaan dan jawaban FAQ landing page.';
COMMENT ON COLUMN public.profil_pesantren.section_titles_json IS 'JSON object untuk eyebrow, title, dan desc tiap section landing page.';
