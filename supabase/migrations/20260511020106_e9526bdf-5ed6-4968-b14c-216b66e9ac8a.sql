
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TABLE IF NOT EXISTS public.newsletter_automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('news','opportunity')),
  frequency TEXT NOT NULL DEFAULT 'daily' CHECK (frequency IN ('hourly','daily','weekly')),
  time_of_day TIME DEFAULT '09:00',
  day_of_week INT,
  segment TEXT NOT NULL DEFAULT 'subscribers',
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_test_mode BOOLEAN NOT NULL DEFAULT false,
  test_email TEXT,
  last_run_at TIMESTAMPTZ,
  last_dispatched_id UUID,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.newsletter_automations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage automations" ON public.newsletter_automations;
CREATE POLICY "Admins manage automations" ON public.newsletter_automations
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS tg_newsletter_automations_updated ON public.newsletter_automations;
CREATE TRIGGER tg_newsletter_automations_updated
  BEFORE UPDATE ON public.newsletter_automations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO storage.buckets (id, name, public)
VALUES ('newsletter-assets', 'newsletter-assets', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read newsletter assets" ON storage.objects;
CREATE POLICY "Public read newsletter assets" ON storage.objects
  FOR SELECT USING (bucket_id = 'newsletter-assets');

DROP POLICY IF EXISTS "Admins upload newsletter assets" ON storage.objects;
CREATE POLICY "Admins upload newsletter assets" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'newsletter-assets' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins update newsletter assets" ON storage.objects;
CREATE POLICY "Admins update newsletter assets" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'newsletter-assets' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins delete newsletter assets" ON storage.objects;
CREATE POLICY "Admins delete newsletter assets" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'newsletter-assets' AND public.has_role(auth.uid(), 'admin'));
