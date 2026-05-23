
-- =========================================================
-- IDEMPOTENT REPLAY OF supabase/migrations/* — safe, no DROPs of existing tables
-- =========================================================

-- 1. app_role enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin','conseiller','gestionnaire','partenaire','inscrit');
  END IF;
END$$;

-- Add any missing enum values (safe individually)
DO $$
BEGIN
  BEGIN ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'admin'; EXCEPTION WHEN others THEN NULL; END;
  BEGIN ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'conseiller'; EXCEPTION WHEN others THEN NULL; END;
  BEGIN ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'gestionnaire'; EXCEPTION WHEN others THEN NULL; END;
  BEGIN ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'partenaire'; EXCEPTION WHEN others THEN NULL; END;
  BEGIN ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'inscrit'; EXCEPTION WHEN others THEN NULL; END;
END$$;

-- 2. user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role    public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. has_role() SECURITY DEFINER helper
CREATE OR REPLACE FUNCTION public.has_role(uid UUID, target_role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = uid AND role = target_role
  );
$$;
REVOKE ALL ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated;

-- Policies on user_roles
DROP POLICY IF EXISTS "user_roles: self read" ON public.user_roles;
CREATE POLICY "user_roles: self read" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "user_roles: admin manage" ON public.user_roles;
CREATE POLICY "user_roles: admin manage" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4. lead_events table
CREATE TABLE IF NOT EXISTS public.lead_events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id      UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  event_name   VARCHAR(100) NOT NULL,
  properties   JSONB NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.lead_events ALTER COLUMN lead_id DROP NOT NULL;
CREATE INDEX IF NOT EXISTS idx_lead_events_lead_id     ON public.lead_events(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_events_created_at  ON public.lead_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_events_event_name  ON public.lead_events(event_name);
ALTER TABLE public.lead_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_roles select all auth"          ON public.lead_events;
DROP POLICY IF EXISTS "user_roles insert all auth"          ON public.lead_events;
DROP POLICY IF EXISTS "lead_events: staff read"             ON public.lead_events;
DROP POLICY IF EXISTS "lead_events: admin insert"           ON public.lead_events;
DROP POLICY IF EXISTS "lead_events: anon/auth insert"       ON public.lead_events;

CREATE POLICY "lead_events: staff read" ON public.lead_events
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'gestionnaire')
    OR public.has_role(auth.uid(), 'conseiller')
  );

CREATE POLICY "lead_events: anon/auth insert" ON public.lead_events
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- 5. checklist_states
CREATE TABLE IF NOT EXISTS public.checklist_states (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id           UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  created_at        TIMESTAMPTZ DEFAULT now(),
  type_demarche     VARCHAR(30) NOT NULL,
  docs_checklist    JSONB NOT NULL DEFAULT '{}',
  docs_manquants    INTEGER NOT NULL DEFAULT 0,
  attestation_ok    BOOLEAN NOT NULL DEFAULT FALSE,
  dispense_demandee BOOLEAN DEFAULT FALSE,
  situation_pro     VARCHAR(20)
);
CREATE INDEX IF NOT EXISTS idx_checklist_states_lead_id ON public.checklist_states(lead_id);
ALTER TABLE public.checklist_states ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert checklist states" ON public.checklist_states;
CREATE POLICY "Anyone can insert checklist states" ON public.checklist_states
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Staff can read checklist states" ON public.checklist_states;
CREATE POLICY "Staff can read checklist states" ON public.checklist_states
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'gestionnaire')
    OR public.has_role(auth.uid(), 'conseiller')
  );

-- 6. Tunnel columns on leads (idempotent)
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS tunnel VARCHAR(30),
  ADD COLUMN IF NOT EXISTS whatsapp_consent BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS consent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS destination VARCHAR(20),
  ADD COLUMN IF NOT EXISTS demarche_inconnue BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS contacte BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS contacte_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS financement_opt_in BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS partenaire_opt_in BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS partner_status VARCHAR(30) DEFAULT 'unassigned';

-- 7. Funding columns on leads (idempotent — most already present)
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

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='leads_funding_status_check') THEN
    ALTER TABLE public.leads ADD CONSTRAINT leads_funding_status_check
      CHECK (funding_status IN ('not_requested','interested','to_qualify','ready_to_transmit','transmitted'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='leads_lead_intent_check') THEN
    ALTER TABLE public.leads ADD CONSTRAINT leads_lead_intent_check
      CHECK (lead_intent IN ('training','funding_only','both'));
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_leads_funding_status ON public.leads (funding_status);
CREATE INDEX IF NOT EXISTS idx_leads_lead_intent    ON public.leads (lead_intent);
CREATE INDEX IF NOT EXISTS idx_leads_financement_opt_in ON public.leads (financement_opt_in);

-- 8. Strict RLS on partners / partner_transmissions
DROP POLICY IF EXISTS "Allow authenticated users full access to partners" ON public.partners;
DROP POLICY IF EXISTS "partners: admin+gestionnaire read" ON public.partners;
DROP POLICY IF EXISTS "partners: admin insert" ON public.partners;
DROP POLICY IF EXISTS "partners: admin update" ON public.partners;
DROP POLICY IF EXISTS "partners: admin delete" ON public.partners;

CREATE POLICY "partners: admin+gestionnaire read" ON public.partners
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestionnaire'));
CREATE POLICY "partners: admin insert" ON public.partners
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "partners: admin update" ON public.partners
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "partners: admin delete" ON public.partners
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Allow authenticated users full access to transmissions" ON public.partner_transmissions;
DROP POLICY IF EXISTS "transmissions: admin+gestionnaire read" ON public.partner_transmissions;
DROP POLICY IF EXISTS "transmissions: admin+gestionnaire insert" ON public.partner_transmissions;

CREATE POLICY "transmissions: admin+gestionnaire read" ON public.partner_transmissions
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestionnaire'));
CREATE POLICY "transmissions: admin+gestionnaire insert" ON public.partner_transmissions
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestionnaire'));

-- 9. RGPD: reset forced consent on legacy leads
UPDATE public.leads
SET partenaire_consent = false,
    partenaire_consent_at = null,
    partner_id = null,
    partner_status = 'pending'
WHERE created_at < '2026-05-18T00:00:00Z'
  AND partenaire_consent = true;
