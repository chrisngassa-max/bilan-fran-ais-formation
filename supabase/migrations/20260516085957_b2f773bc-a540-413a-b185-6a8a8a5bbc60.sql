
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  attempt_id UUID NULL,
  email TEXT NOT NULL,
  whatsapp_phone TEXT NULL,
  consent_marketing BOOLEAN NOT NULL DEFAULT false,
  source TEXT NOT NULL DEFAULT 'bilan_capture',
  estimated_level TEXT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_attempt_id ON public.leads(attempt_id);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Public visitors (the lead capture form is public) may INSERT their own lead.
-- No SELECT/UPDATE/DELETE policies → only service-role (admin) can read.
DROP POLICY IF EXISTS "Anyone can submit a lead" ON public.leads;
CREATE POLICY "Anyone can submit a lead"
  ON public.leads
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    email IS NOT NULL
    AND length(email) BETWEEN 3 AND 255
    AND consent_marketing = true
  );
