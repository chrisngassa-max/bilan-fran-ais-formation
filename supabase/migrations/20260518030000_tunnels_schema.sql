-- Migration to support the 3 Tunnels lead generation system

-- 1. Alter public.leads table to add missing columns
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS tunnel VARCHAR(30),
  ADD COLUMN IF NOT EXISTS whatsapp_consent BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS consent_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS destination VARCHAR(20),
  ADD COLUMN IF NOT EXISTS demarche_inconnue BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS contacte BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS contacte_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS financement_opt_in BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS partenaire_opt_in BOOLEAN DEFAULT FALSE;

-- 2. Create public.checklist_states table
CREATE TABLE IF NOT EXISTS public.checklist_states (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id           UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  type_demarche     VARCHAR(30) NOT NULL,
  docs_checklist    JSONB NOT NULL DEFAULT '{}',
  docs_manquants    INTEGER NOT NULL DEFAULT 0,
  attestation_ok    BOOLEAN NOT NULL DEFAULT FALSE,
  dispense_demandee BOOLEAN DEFAULT FALSE,
  situation_pro     VARCHAR(20)
);

-- Index on checklist_states
CREATE INDEX IF NOT EXISTS idx_checklist_states_lead_id ON public.checklist_states(lead_id);

-- 3. Enable RLS on checklist_states
ALTER TABLE public.checklist_states ENABLE ROW LEVEL SECURITY;

-- 4. Set RLS policies for checklist_states
-- Anyone can insert if they submit a checklist
CREATE POLICY "Anyone can insert checklist states" ON public.checklist_states
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Staff can read checklist states
CREATE POLICY "Staff can read checklist states" ON public.checklist_states
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'gestionnaire')
    OR public.has_role(auth.uid(), 'conseiller')
  );

-- 5. Extend lead_events RLS for anonymous inserts since standard clients might track events before logging in
DROP POLICY IF EXISTS "lead_events: anon/auth insert" ON public.lead_events;
CREATE POLICY "lead_events: anon/auth insert" ON public.lead_events
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);
