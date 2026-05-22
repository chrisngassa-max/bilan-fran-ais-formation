-- Idempotent migration: funding profile columns on public.leads

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS funding_status text NOT NULL DEFAULT 'not_requested',
  ADD COLUMN IF NOT EXISTS lead_intent text NOT NULL DEFAULT 'training',
  ADD COLUMN IF NOT EXISTS professional_status text,
  ADD COLUMN IF NOT EXISTS sector_activity text,
  ADD COLUMN IF NOT EXISTS birth_date date,
  ADD COLUMN IF NOT EXISTS nationality text,
  ADD COLUMN IF NOT EXISTS address_line1 text,
  ADD COLUMN IF NOT EXISTS postal_code text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS cpf_status text,
  ADD COLUMN IF NOT EXISTS cpf_balance_declared numeric,
  ADD COLUMN IF NOT EXISTS france_travail_registered boolean,
  ADD COLUMN IF NOT EXISTS employer_support boolean,
  ADD COLUMN IF NOT EXISTS funding_target_date date,
  ADD COLUMN IF NOT EXISTS funding_next_action text,
  ADD COLUMN IF NOT EXISTS funding_followup_at timestamptz,
  ADD COLUMN IF NOT EXISTS funding_internal_notes text;

-- Constraints (idempotent via DO block)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'leads_funding_status_check'
  ) THEN
    ALTER TABLE public.leads
      ADD CONSTRAINT leads_funding_status_check
      CHECK (funding_status IN ('not_requested','interested','to_qualify','ready_to_transmit','transmitted'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'leads_lead_intent_check'
  ) THEN
    ALTER TABLE public.leads
      ADD CONSTRAINT leads_lead_intent_check
      CHECK (lead_intent IN ('training','funding_only','both'));
  END IF;
END$$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_leads_funding_status ON public.leads (funding_status);
CREATE INDEX IF NOT EXISTS idx_leads_lead_intent ON public.leads (lead_intent);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='leads' AND column_name='financement_opt_in'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_leads_financement_opt_in ON public.leads (financement_opt_in)';
  END IF;
END$$;