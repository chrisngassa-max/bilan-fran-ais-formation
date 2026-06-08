-- Solidify funding qualification fields previously stored only in leads.metadata.
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS funding_status VARCHAR(30) NOT NULL DEFAULT 'not_requested',
  ADD COLUMN IF NOT EXISTS lead_intent VARCHAR(50) NOT NULL DEFAULT 'training',
  ADD COLUMN IF NOT EXISTS professional_status VARCHAR(40),
  ADD COLUMN IF NOT EXISTS sector_activity VARCHAR(120),
  ADD COLUMN IF NOT EXISTS birth_date DATE,
  ADD COLUMN IF NOT EXISTS nationality VARCHAR(120),
  ADD COLUMN IF NOT EXISTS address_line1 TEXT,
  ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20),
  ADD COLUMN IF NOT EXISTS city VARCHAR(120),
  ADD COLUMN IF NOT EXISTS cpf_status VARCHAR(20),
  ADD COLUMN IF NOT EXISTS cpf_balance_declared NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS france_travail_registered VARCHAR(20),
  ADD COLUMN IF NOT EXISTS employer_support VARCHAR(20),
  ADD COLUMN IF NOT EXISTS funding_target_date DATE,
  ADD COLUMN IF NOT EXISTS funding_next_action VARCHAR(40),
  ADD COLUMN IF NOT EXISTS funding_followup_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS funding_internal_notes TEXT;

ALTER TABLE public.leads
  DROP CONSTRAINT IF EXISTS leads_funding_status_check;

ALTER TABLE public.leads
  ADD CONSTRAINT leads_funding_status_check
  CHECK (
    funding_status IN (
      'not_requested',
      'interested',
      'to_qualify',
      'ready_to_transmit',
      'transmitted'
    )
  );

ALTER TABLE public.leads
  DROP CONSTRAINT IF EXISTS leads_lead_intent_check;

ALTER TABLE public.leads
  ADD CONSTRAINT leads_lead_intent_check
  CHECK (
    lead_intent IN (
      'training',
      'training_financing',
      'admin_accompaniment',
      'training_and_admin_accompaniment'
    )
  );

CREATE INDEX IF NOT EXISTS idx_leads_funding_status
  ON public.leads(funding_status);

CREATE INDEX IF NOT EXISTS idx_leads_lead_intent
  ON public.leads(lead_intent);

CREATE INDEX IF NOT EXISTS idx_leads_financement_opt_in
  ON public.leads(financement_opt_in)
  WHERE financement_opt_in = TRUE;
