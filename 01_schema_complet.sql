-- ==============================================================
-- SCHEMA COMPLET - à coller dans le SQL Editor de ton Supabase
-- Toutes les migrations dans l'ordre chronologique
-- Généré le 2026-06-07
-- ==============================================================


-- ────────────────────────────────────────────────────────────
-- Migration: 20260516085957_b2f773bc-a540-413a-b185-6a8a8a5bbc60.sql
-- ────────────────────────────────────────────────────────────

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


-- ────────────────────────────────────────────────────────────
-- Migration: 20260517064111_89a24ccf-a39c-4626-a001-688822c63eff.sql
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.test_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  scores JSONB NOT NULL DEFAULT '{}',
  niveau_estime TEXT,
  flags JSONB NOT NULL DEFAULT '{}',
  duree_secondes INTEGER,
  score_production INTEGER,
  production_feedback JSONB,
  ia_evaluation_consent BOOLEAN DEFAULT FALSE,
  ia_evaluation_consent_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.magic_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_magic_links_token ON public.magic_links(token);

CREATE TABLE IF NOT EXISTS public.partenaire_comptes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  email VARCHAR(200) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  nom VARCHAR(100),
  actif BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS public.lead_partenaire_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  partenaire_id UUID REFERENCES public.partenaire_comptes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(lead_id, partenaire_id)
);

CREATE TABLE IF NOT EXISTS public.leads_partenaire_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  partenaire_id UUID REFERENCES public.partenaire_comptes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  statut VARCHAR(20) NOT NULL DEFAULT 'nouveau',
  note TEXT,
  contacte_at TIMESTAMPTZ
);

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS prenom VARCHAR(100),
  ADD COLUMN IF NOT EXISTS consent_partner BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS consent_timestamp TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS type_demarche TEXT,
  ADD COLUMN IF NOT EXISTS checklist_states JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS situation_pro TEXT,
  ADD COLUMN IF NOT EXISTS date_rdv_prefecture DATE,
  ADD COLUMN IF NOT EXISTS dispense_demandee BOOLEAN DEFAULT FALSE;

-- RLS : tout est verrouillé par défaut (server-only via service role)
ALTER TABLE public.test_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.magic_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partenaire_comptes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_partenaire_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads_partenaire_status ENABLE ROW LEVEL SECURITY;


-- ────────────────────────────────────────────────────────────
-- Migration: 20260517065128_c77a762e-003c-4144-9eb8-54bdab75c8f1.sql
-- ────────────────────────────────────────────────────────────
-- Contrainte unique nécessaire pour les upsert onConflict des fonctions partenaire
CREATE UNIQUE INDEX IF NOT EXISTS leads_partenaire_status_lead_partenaire_uniq
  ON public.leads_partenaire_status (lead_id, partenaire_id);

-- Index utiles pour les lectures du dashboard
CREATE INDEX IF NOT EXISTS lead_partenaire_assignments_partenaire_idx
  ON public.lead_partenaire_assignments (partenaire_id);
CREATE INDEX IF NOT EXISTS leads_partenaire_status_partenaire_idx
  ON public.leads_partenaire_status (partenaire_id);

-- ────────────────────────────────────────────────────────────
-- Migration: 20260517080000_update_leads_v2.sql
-- ────────────────────────────────────────────────────────────
-- Drop dependent tables first to avoid foreign key issues
DROP TABLE IF EXISTS public.test_sessions CASCADE;
DROP TABLE IF EXISTS public.magic_links CASCADE;
DROP TABLE IF EXISTS public.lead_partenaire_assignments CASCADE;
DROP TABLE IF EXISTS public.leads_partenaire_status CASCADE;
DROP TABLE IF EXISTS public.leads CASCADE;

-- Recreate leads with exact Sprint A schema
CREATE TABLE public.leads (
  id                           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at                   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at                   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Source et type
  source                       VARCHAR(50) NOT NULL,
  -- bilan_post_result | accompagnement_admin | test_rapide | test_complet
  lead_type                    VARCHAR(20) NOT NULL,
  -- training | admin_support | combined

  -- Identité
  first_name                   VARCHAR(100) NOT NULL,
  last_name                    VARCHAR(100),
  email                        VARCHAR(200),
  whatsapp_phone               VARCHAR(20),

  -- Données formation
  estimated_level              VARCHAR(15),
  -- A1 | A2 | B1 | B1_nat | B2 | a_verifier
  goal                         VARCHAR(50),

  -- Données administrative
  partner_request_type         VARCHAR(30),
  -- carte_sejour | resident | naturalisation | je_ne_sais_pas | autre
  message                      TEXT,

  -- Consentements (obligatoires)
  consent_training             BOOLEAN NOT NULL DEFAULT FALSE,
  consent_partner              BOOLEAN NOT NULL DEFAULT FALSE,
  consent_training_text_version VARCHAR(10),
  -- ex: "v1.0" — version du texte de consentement affiché
  consent_partner_text_version  VARCHAR(10),
  consent_timestamp            TIMESTAMP WITH TIME ZONE,

  -- Statut de traitement
  status                       VARCHAR(30) DEFAULT 'new',
  -- new | qualified | converted_to_case | exported | archived

  -- Assignation interne
  assigned_to                  UUID,
  -- référence vers users (gestionnaire)

  -- Partenaire (nullable — pas de partenaire actif en V1)
  partner_id                   UUID,
  -- nullable — référence vers partners quand existant
  partner_status               VARCHAR(30) DEFAULT 'unassigned'
  -- unassigned | partner_requested_but_unassigned | assigned | transmitted | acknowledged
);

-- Index utiles
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_leads_lead_type ON public.leads(lead_type);
CREATE INDEX idx_leads_created_at ON public.leads(created_at DESC);
CREATE INDEX idx_leads_consent_partner ON public.leads(consent_partner);
CREATE INDEX idx_leads_email ON public.leads(email);

-- Re-enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a lead"
  ON public.leads
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    (email IS NOT NULL AND length(email) BETWEEN 3 AND 255)
    OR (whatsapp_phone IS NOT NULL)
  );

-- Recreate test_sessions
CREATE TABLE public.test_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  scores JSONB NOT NULL DEFAULT '{}',
  niveau_estime TEXT,
  flags JSONB NOT NULL DEFAULT '{}',
  duree_secondes INTEGER,
  score_production INTEGER,
  production_feedback JSONB,
  ia_evaluation_consent BOOLEAN DEFAULT FALSE,
  ia_evaluation_consent_at TIMESTAMPTZ
);
ALTER TABLE public.test_sessions ENABLE ROW LEVEL SECURITY;

-- Recreate magic_links
CREATE TABLE public.magic_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX idx_magic_links_token ON public.magic_links(token);
ALTER TABLE public.magic_links ENABLE ROW LEVEL SECURITY;

-- Recreate lead_partenaire_assignments
CREATE TABLE public.lead_partenaire_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  partenaire_id UUID REFERENCES public.partenaire_comptes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(lead_id, partenaire_id)
);
CREATE INDEX lead_partenaire_assignments_partenaire_idx ON public.lead_partenaire_assignments (partenaire_id);
ALTER TABLE public.lead_partenaire_assignments ENABLE ROW LEVEL SECURITY;

-- Recreate leads_partenaire_status
CREATE TABLE public.leads_partenaire_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  partenaire_id UUID REFERENCES public.partenaire_comptes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  statut VARCHAR(20) NOT NULL DEFAULT 'nouveau',
  note TEXT,
  contacte_at TIMESTAMPTZ
);
CREATE UNIQUE INDEX leads_partenaire_status_lead_partenaire_uniq ON public.leads_partenaire_status (lead_id, partenaire_id);
CREATE INDEX leads_partenaire_status_partenaire_idx ON public.leads_partenaire_status (partenaire_id);
ALTER TABLE public.leads_partenaire_status ENABLE ROW LEVEL SECURITY;


-- ────────────────────────────────────────────────────────────
-- Migration: 20260517100000_sprint_b_roles_and_tables.sql
-- ────────────────────────────────────────────────────────────
-- Migration Sprint B: Ajout des rôles et de la table lead_events

-- 1. Ajout sécurisé des valeurs à l'énumération public.app_role
-- Note: Si la valeur existe déjà, Supabase ignorera ou renverra une erreur gérée.
-- Pour éviter d'interrompre la migration, nous exécutons ces commandes individuellement.
-- ALTER TYPE public.app_role ADD VALUE 'gestionnaire';
-- ALTER TYPE public.app_role ADD VALUE 'partenaire';
-- ALTER TYPE public.app_role ADD VALUE 'inscrit';

-- 2. Création de la table lead_events pour l'historique de traitement
CREATE TABLE IF NOT EXISTS public.lead_events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id      UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  event_name   VARCHAR(100) NOT NULL,
  properties   JSONB NOT NULL DEFAULT '{}',
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour accélérer la recherche par lead_id
CREATE INDEX IF NOT EXISTS idx_lead_events_lead_id ON public.lead_events(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_events_created_at ON public.lead_events(created_at DESC);

-- 3. Activation de la sécurité au niveau des lignes (RLS) sur lead_events
ALTER TABLE public.lead_events ENABLE ROW LEVEL SECURITY;

-- Politiques de sécurité
CREATE POLICY "user_roles select all auth" ON public.lead_events
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "user_roles insert all auth" ON public.lead_events
  FOR INSERT TO authenticated WITH CHECK (true);


-- ────────────────────────────────────────────────────────────
-- Migration: 20260517120000_sprint_c_partners.sql
-- ────────────────────────────────────────────────────────────
-- 1. Table partners
CREATE TABLE IF NOT EXISTS public.partners (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Identité publique
  name                  VARCHAR(200) NOT NULL,
  slug                  VARCHAR(100) UNIQUE NOT NULL,

  -- Contact
  contact_name          VARCHAR(200),
  contact_email         VARCHAR(200),
  contact_whatsapp      VARCHAR(20),

  -- Statut
  status                VARCHAR(20) DEFAULT 'draft',
  -- draft | active | inactive

  -- Services proposés (carte_sejour, naturalisation, resident, etc.)
  service_types         TEXT[] DEFAULT '{}',

  -- Paramètres de transmission
  requires_manual_export BOOLEAN DEFAULT TRUE,
  transmission_mode     VARCHAR(20) DEFAULT 'manual_csv',
  -- manual_csv | manual_pdf | email | future_api

  -- Paramètres techniques (remplis quand partenaire réel)
  reception_email       VARCHAR(200),
  webhook_url           VARCHAR(500),

  -- Paramètres juridiques
  legal_notes           TEXT,
  kbis_verified         BOOLEAN DEFAULT FALSE,
  insurance_verified    BOOLEAN DEFAULT FALSE,
  contract_signed       BOOLEAN DEFAULT FALSE,
  contract_signed_at    TIMESTAMP WITH TIME ZONE,

  -- Textes de consentement nominatifs
  consent_text_override TEXT
);

-- Index pour accélérer les requêtes par statut et par slug
CREATE INDEX IF NOT EXISTS idx_partners_status ON public.partners(status);
CREATE INDEX IF NOT EXISTS idx_partners_slug ON public.partners(slug);

-- 2. Table partner_transmissions
CREATE TABLE IF NOT EXISTS public.partner_transmissions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Références
  lead_id           UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  partner_id        UUID REFERENCES public.partners(id) ON DELETE SET NULL,

  -- Mode de transmission
  transmission_mode VARCHAR(20) NOT NULL,
  -- manual_csv | manual_pdf | email | future_api

  -- Qui a déclenché
  transmitted_by    UUID,
  -- référence vers users (admin ou gestionnaire)

  -- Preuves (snapshots au moment de la transmission)
  payload_snapshot  JSONB NOT NULL,
  -- copie des données du lead au moment de l'envoi
  consent_snapshot  JSONB NOT NULL,
  -- copie exacte des consentements + versions + horodatage

  -- Statut
  status            VARCHAR(20) DEFAULT 'prepared',
  -- prepared | sent | acknowledged | failed

  -- Métadonnées
  transmitted_at    TIMESTAMP WITH TIME ZONE,
  error_message     TEXT,
  notes             TEXT
);

CREATE INDEX IF NOT EXISTS idx_partner_transmissions_lead_id ON public.partner_transmissions(lead_id);
CREATE INDEX IF NOT EXISTS idx_partner_transmissions_partner_id ON public.partner_transmissions(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_transmissions_status ON public.partner_transmissions(status);

-- 3. Ajouter la contrainte FK sur la table leads vers partners
ALTER TABLE public.leads 
  DROP CONSTRAINT IF EXISTS fk_leads_partner_id;

ALTER TABLE public.leads
  ADD CONSTRAINT fk_leads_partner_id
  FOREIGN KEY (partner_id) REFERENCES public.partners(id) ON DELETE SET NULL;

-- 4. RLS & Politiques de Sécurité
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_transmissions ENABLE ROW LEVEL SECURITY;

-- Politiques partners
DROP POLICY IF EXISTS "Allow authenticated users full access to partners" ON public.partners;
CREATE POLICY "Allow authenticated users full access to partners"
  ON public.partners
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Politiques partner_transmissions
DROP POLICY IF EXISTS "Allow authenticated users full access to transmissions" ON public.partner_transmissions;
CREATE POLICY "Allow authenticated users full access to transmissions"
  ON public.partner_transmissions
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);


-- ────────────────────────────────────────────────────────────
-- Migration: 20260518000000_alter_lead_events_null.sql
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.lead_events ALTER COLUMN lead_id DROP NOT NULL;
CREATE INDEX IF NOT EXISTS idx_lead_events_event_name ON public.lead_events(event_name);


-- ────────────────────────────────────────────────────────────
-- Migration: 20260518010000_reset_forced_consent.sql
-- ────────────────────────────────────────────────────────────
-- RGPD Compliance: Reset forced consent flag for leads created before May 18, 2026
UPDATE public.leads
SET consent_partner = false,
    consent_timestamp = null,
    partner_id = null,
    partner_status = 'pending'
WHERE created_at < '2026-05-18T00:00:00Z'
  AND consent_partner = true;


-- ────────────────────────────────────────────────────────────
-- Migration: 20260518020000_strict_rls.sql
-- ────────────────────────────────────────────────────────────
-- Helper: SECURITY DEFINER to avoid recursion when policies query user_roles
DROP FUNCTION IF EXISTS public.has_role(UUID, public.app_role) CASCADE; CREATE OR REPLACE FUNCTION public.has_role(uid UUID, target_role public.app_role)
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

-- ====== lead_events ======
DROP POLICY IF EXISTS "user_roles select all auth" ON public.lead_events;
DROP POLICY IF EXISTS "user_roles insert all auth" ON public.lead_events;

CREATE POLICY "lead_events: staff read" ON public.lead_events
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'gestionnaire')
    OR public.has_role(auth.uid(), 'conseiller')
  );

CREATE POLICY "lead_events: admin insert" ON public.lead_events
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ====== partners ======
DROP POLICY IF EXISTS "Allow authenticated users full access to partners" ON public.partners;

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

-- ====== partner_transmissions ======
DROP POLICY IF EXISTS "Allow authenticated users full access to transmissions" ON public.partner_transmissions;

CREATE POLICY "transmissions: admin+gestionnaire read" ON public.partner_transmissions
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestionnaire'));

CREATE POLICY "transmissions: admin+gestionnaire insert" ON public.partner_transmissions
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestionnaire'));


-- ────────────────────────────────────────────────────────────
-- Migration: 20260518030000_tunnels_schema.sql
-- ────────────────────────────────────────────────────────────
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


-- ────────────────────────────────────────────────────────────
-- Migration: 20260522231210_23573e47-4b09-4f72-8293-d080922ca1aa.sql
-- ────────────────────────────────────────────────────────────
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

-- ────────────────────────────────────────────────────────────
-- Migration: 20260523000000_module_cohortes_v1.sql
-- ────────────────────────────────────────────────────────────
-- Module cohortes v1 — idempotent
-- Tables: formation_journeys (si absente), cohorts, cohort_sessions, cohort_enrollments, attendance

-- ══════════════════════════════════════════════════════
-- TABLE 0 : public.formation_journeys (prérequis si absente)
-- ══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.formation_journeys (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  title          TEXT NOT NULL,
  slug           TEXT,
  description    TEXT,
  level          TEXT,
  duration_weeks INTEGER,
  price_euros    NUMERIC(10,2),
  status         TEXT DEFAULT 'draft'
);

-- ══════════════════════════════════════════════════════
-- TABLE 1 : public.cohorts
-- ══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.cohorts (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  code                      VARCHAR(30) UNIQUE,
  formation_journey_id      UUID REFERENCES public.formation_journeys(id) ON DELETE RESTRICT,
  intensity                 VARCHAR(20) NOT NULL DEFAULT 'standard',
  start_date                DATE NOT NULL,
  estimated_end_date        DATE,
  weekly_schedule           JSONB NOT NULL DEFAULT '[]',
  total_sessions            INTEGER,
  max_students              INTEGER NOT NULL DEFAULT 5,
  min_students_to_confirm   INTEGER NOT NULL DEFAULT 3,
  status                    VARCHAR(20) NOT NULL DEFAULT 'draft',
  visibility                VARCHAR(20) NOT NULL DEFAULT 'private',
  formateur_id              UUID,
  meeting_url               TEXT,
  exam_blank_1_session      INTEGER,
  exam_blank_2_session      INTEGER,
  exam_blank_3_session      INTEGER,
  notes_internes            TEXT
);

CREATE INDEX IF NOT EXISTS idx_cohorts_status      ON public.cohorts(status);
CREATE INDEX IF NOT EXISTS idx_cohorts_start_date  ON public.cohorts(start_date);
CREATE INDEX IF NOT EXISTS idx_cohorts_journey_id  ON public.cohorts(formation_journey_id);

ALTER TABLE public.cohorts ENABLE ROW LEVEL SECURITY;

-- ══════════════════════════════════════════════════════
-- TABLE 2 : public.cohort_sessions
-- ══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.cohort_sessions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  cohort_id        UUID NOT NULL REFERENCES public.cohorts(id) ON DELETE CASCADE,
  session_number   INTEGER NOT NULL,
  session_date     DATE NOT NULL,
  start_time       TIME NOT NULL,
  end_time         TIME NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 180,
  session_type     VARCHAR(20) NOT NULL DEFAULT 'cours',
  title            VARCHAR(200),
  format           VARCHAR(20) NOT NULL DEFAULT 'visio',
  meeting_url      TEXT,
  location         TEXT,
  status           VARCHAR(20) NOT NULL DEFAULT 'scheduled',
  formateur_id     UUID,
  objectives       TEXT,
  documents        JSONB DEFAULT '[]',
  notes_formateur  TEXT,
  UNIQUE (cohort_id, session_number)
);

CREATE INDEX IF NOT EXISTS idx_csessions_cohort_id ON public.cohort_sessions(cohort_id);
CREATE INDEX IF NOT EXISTS idx_csessions_date      ON public.cohort_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_csessions_type      ON public.cohort_sessions(session_type);

ALTER TABLE public.cohort_sessions ENABLE ROW LEVEL SECURITY;

-- ══════════════════════════════════════════════════════
-- TABLE 3 : public.cohort_enrollments
-- ══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.cohort_enrollments (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  cohort_id        UUID NOT NULL REFERENCES public.cohorts(id) ON DELETE CASCADE,
  lead_id          UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  status           VARCHAR(30) NOT NULL DEFAULT 'pending',
  payment_mode     VARCHAR(30),
  stripe_payment_intent_id TEXT,
  acompte_paid     BOOLEAN DEFAULT FALSE,
  acompte_amount   NUMERIC(10,2),
  solde_due        NUMERIC(10,2),
  total_paid       NUMERIC(10,2) DEFAULT 0,
  stafy_status     VARCHAR(30) DEFAULT 'not_sent',
  stafy_dossier_id TEXT,
  stafy_transmitted_at TIMESTAMPTZ,
  reserved_at      TIMESTAMPTZ DEFAULT now(),
  confirmed_at     TIMESTAMPTZ,
  cancelled_at     TIMESTAMPTZ,
  cancellation_reason TEXT,
  CONSTRAINT uq_enrollment_lead_cohort UNIQUE (cohort_id, lead_id)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_cohort_id ON public.cohort_enrollments(cohort_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_lead_id   ON public.cohort_enrollments(lead_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status    ON public.cohort_enrollments(status);

ALTER TABLE public.cohort_enrollments ENABLE ROW LEVEL SECURITY;

-- ══════════════════════════════════════════════════════
-- TABLE 4 : public.attendance
-- ══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.attendance (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  session_id       UUID NOT NULL REFERENCES public.cohort_sessions(id) ON DELETE CASCADE,
  lead_id          UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  status           VARCHAR(20) NOT NULL DEFAULT 'pending',
  arrival_time     TIMESTAMPTZ,
  duration_minutes INTEGER,
  signature_method VARCHAR(20),
  signed_at        TIMESTAMPTZ,
  ip_address       TEXT,
  notes            TEXT,
  marked_by        UUID,
  CONSTRAINT uq_attendance_session_lead UNIQUE (session_id, lead_id)
);

CREATE INDEX IF NOT EXISTS idx_attendance_session_id ON public.attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_lead_id    ON public.attendance(lead_id);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- ══════════════════════════════════════════════════════
-- POLITIQUES RLS (après création de toutes les tables)
-- ══════════════════════════════════════════════════════

-- cohorts
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'cohorts' AND policyname = 'cohorts: staff full access') THEN
    CREATE POLICY "cohorts: staff full access" ON public.cohorts
      FOR ALL TO authenticated
      USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestionnaire'))
      WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestionnaire'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'cohorts' AND policyname = 'cohorts: public open visible') THEN
    CREATE POLICY "cohorts: public open visible" ON public.cohorts
      FOR SELECT TO anon, authenticated
      USING (visibility = 'public' AND status IN ('open', 'confirming', 'confirmed'));
  END IF;
END $$;

-- cohort_sessions
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'cohort_sessions' AND policyname = 'cohort_sessions: staff full access') THEN
    CREATE POLICY "cohort_sessions: staff full access" ON public.cohort_sessions
      FOR ALL TO authenticated
      USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestionnaire'))
      WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestionnaire'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'cohort_sessions' AND policyname = 'cohort_sessions: inscrit sees own') THEN
    CREATE POLICY "cohort_sessions: inscrit sees own" ON public.cohort_sessions
      FOR SELECT TO authenticated
      USING (
        cohort_id IN (
          SELECT ce.cohort_id FROM public.cohort_enrollments ce
          JOIN public.leads l ON l.id = ce.lead_id
          WHERE l.email = auth.email()
        )
      );
  END IF;
END $$;

-- cohort_enrollments
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'cohort_enrollments' AND policyname = 'enrollments: staff full access') THEN
    CREATE POLICY "enrollments: staff full access" ON public.cohort_enrollments
      FOR ALL TO authenticated
      USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestionnaire'))
      WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestionnaire'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'cohort_enrollments' AND policyname = 'enrollments: inscrit sees own') THEN
    CREATE POLICY "enrollments: inscrit sees own" ON public.cohort_enrollments
      FOR SELECT TO authenticated
      USING (lead_id IN (SELECT id FROM public.leads WHERE email = auth.email()));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'cohort_enrollments' AND policyname = 'enrollments: anon insert') THEN
    CREATE POLICY "enrollments: anon insert" ON public.cohort_enrollments
      FOR INSERT TO anon, authenticated
      WITH CHECK (true);
  END IF;
END $$;

-- attendance
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'attendance' AND policyname = 'attendance: staff full access') THEN
    CREATE POLICY "attendance: staff full access" ON public.attendance
      FOR ALL TO authenticated
      USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestionnaire'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'attendance' AND policyname = 'attendance: inscrit sign own') THEN
    CREATE POLICY "attendance: inscrit sign own" ON public.attendance
      FOR UPDATE TO authenticated
      USING (lead_id IN (SELECT id FROM public.leads WHERE email = auth.email()))
      WITH CHECK (lead_id IN (SELECT id FROM public.leads WHERE email = auth.email()));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'attendance' AND policyname = 'attendance: inscrit read own') THEN
    CREATE POLICY "attendance: inscrit read own" ON public.attendance
      FOR SELECT TO authenticated
      USING (lead_id IN (SELECT id FROM public.leads WHERE email = auth.email()));
  END IF;
END $$;

-- ══════════════════════════════════════════════════════
-- FONCTION UTILITAIRE
-- ══════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.get_cohort_enrolled_count(p_cohort_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.cohort_enrollments
  WHERE cohort_id = p_cohort_id
    AND status IN ('confirmed', 'pending');
$$;


-- ────────────────────────────────────────────────────────────
-- Migration: 20260523071653_870ca5ef-0467-4cb2-bb05-828472307948.sql
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.dossiers (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  lead_id                UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  attempt_id             UUID,
  status_emploi          VARCHAR(30),
  solde_cpf              NUMERIC(10,2),
  has_employer_agreement BOOLEAN,
  has_siret              BOOLEAN,
  has_main_docs          BOOLEAN,
  cpf_mobilise           NUMERIC(10,2),
  opco_estime            NUMERIC(10,2),
  reste_a_charge         NUMERIC(10,2),
  status                 VARCHAR(30) DEFAULT 'new',
  partner_id             UUID,
  partner_status         VARCHAR(30) DEFAULT 'unassigned'
);

-- Add FK to partners only if that table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='partners')
     AND NOT EXISTS (
       SELECT 1 FROM information_schema.table_constraints
       WHERE constraint_schema='public' AND constraint_name='dossiers_partner_id_fkey'
     ) THEN
    ALTER TABLE public.dossiers
      ADD CONSTRAINT dossiers_partner_id_fkey
      FOREIGN KEY (partner_id) REFERENCES public.partners(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_dossiers_lead_id    ON public.dossiers(lead_id);
CREATE INDEX IF NOT EXISTS idx_dossiers_attempt_id ON public.dossiers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_dossiers_status     ON public.dossiers(status);

ALTER TABLE public.dossiers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert a dossier" ON public.dossiers;
CREATE POLICY "Anyone can insert a dossier" ON public.dossiers
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Staff read/update policies: use has_role() if available, otherwise authenticated-only
DO $$
BEGIN
  DROP POLICY IF EXISTS "Staff can read dossiers" ON public.dossiers;
  DROP POLICY IF EXISTS "Staff can update dossiers" ON public.dossiers;

  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname='public' AND p.proname='has_role'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "Staff can read dossiers" ON public.dossiers
        FOR SELECT TO authenticated
        USING (
          public.has_role(auth.uid(), 'admin'::app_role)
          OR public.has_role(auth.uid(), 'gestionnaire'::app_role)
          OR public.has_role(auth.uid(), 'conseiller'::app_role)
        )
    $p$;
    EXECUTE $p$
      CREATE POLICY "Staff can update dossiers" ON public.dossiers
        FOR UPDATE TO authenticated
        USING (
          public.has_role(auth.uid(), 'admin'::app_role)
          OR public.has_role(auth.uid(), 'gestionnaire'::app_role)
        )
    $p$;
  ELSE
    EXECUTE $p$
      CREATE POLICY "Staff can read dossiers" ON public.dossiers
        FOR SELECT TO authenticated
        USING (true)
    $p$;
    EXECUTE $p$
      CREATE POLICY "Staff can update dossiers" ON public.dossiers
        FOR UPDATE TO authenticated
        USING (true)
    $p$;
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────
-- Migration: 20260523073034_fc511ea5-5c48-4bb2-8392-2561fd18e156.sql
-- ────────────────────────────────────────────────────────────
-- Ajouter la colonne partner_id manquante sur leads
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS partner_id UUID;

-- 1. Table partners
CREATE TABLE IF NOT EXISTS public.partners (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Identité publique
  name                  VARCHAR(200) NOT NULL,
  slug                  VARCHAR(100) UNIQUE NOT NULL,

  -- Contact
  contact_name          VARCHAR(200),
  contact_email         VARCHAR(200),
  contact_whatsapp      VARCHAR(20),

  -- Statut
  status                VARCHAR(20) DEFAULT 'draft',

  -- Services proposés
  service_types         TEXT[] DEFAULT '{}',

  -- Paramètres de transmission
  requires_manual_export BOOLEAN DEFAULT TRUE,
  transmission_mode     VARCHAR(20) DEFAULT 'manual_csv',

  -- Paramètres techniques
  reception_email       VARCHAR(200),
  webhook_url           VARCHAR(500),

  -- Paramètres juridiques
  legal_notes           TEXT,
  kbis_verified         BOOLEAN DEFAULT FALSE,
  insurance_verified    BOOLEAN DEFAULT FALSE,
  contract_signed       BOOLEAN DEFAULT FALSE,
  contract_signed_at    TIMESTAMP WITH TIME ZONE,

  -- Textes de consentement nominatifs
  consent_text_override TEXT
);

-- Index partners
CREATE INDEX IF NOT EXISTS idx_partners_status ON public.partners(status);
CREATE INDEX IF NOT EXISTS idx_partners_slug ON public.partners(slug);

-- 2. Table partner_transmissions
CREATE TABLE IF NOT EXISTS public.partner_transmissions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  lead_id           UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  partner_id        UUID REFERENCES public.partners(id) ON DELETE SET NULL,

  transmission_mode VARCHAR(20) NOT NULL,

  transmitted_by    UUID,

  payload_snapshot  JSONB NOT NULL,
  consent_snapshot  JSONB NOT NULL,

  status            VARCHAR(20) DEFAULT 'prepared',

  transmitted_at    TIMESTAMP WITH TIME ZONE,
  error_message     TEXT,
  notes             TEXT
);

CREATE INDEX IF NOT EXISTS idx_partner_transmissions_lead_id ON public.partner_transmissions(lead_id);
CREATE INDEX IF NOT EXISTS idx_partner_transmissions_partner_id ON public.partner_transmissions(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_transmissions_status ON public.partner_transmissions(status);

-- 3. Contrainte FK sur leads vers partners
ALTER TABLE public.leads 
  DROP CONSTRAINT IF EXISTS fk_leads_partner_id;

ALTER TABLE public.leads
  ADD CONSTRAINT fk_leads_partner_id
  FOREIGN KEY (partner_id) REFERENCES public.partners(id) ON DELETE SET NULL;

-- 4. RLS
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_transmissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users full access to partners" ON public.partners;
CREATE POLICY "Allow authenticated users full access to partners"
  ON public.partners
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users full access to transmissions" ON public.partner_transmissions;
CREATE POLICY "Allow authenticated users full access to transmissions"
  ON public.partner_transmissions
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ────────────────────────────────────────────────────────────
-- Migration: 20260523074014_7d16e600-dbf2-4679-bbb0-6ed951bfa81b.sql
-- ────────────────────────────────────────────────────────────

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
DROP FUNCTION IF EXISTS public.has_role(UUID, public.app_role) CASCADE; CREATE OR REPLACE FUNCTION public.has_role(uid UUID, target_role public.app_role)
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
SET consent_partner = false,
    consent_timestamp = null,
    partner_id = null,
    partner_status = 'pending'
WHERE created_at < '2026-05-18T00:00:00Z'
  AND consent_partner = true;


-- ────────────────────────────────────────────────────────────
-- Migration: 20260523074515_59b13ce0-3093-47e4-9a2d-adc384f8f2e7.sql
-- ────────────────────────────────────────────────────────────
-- Module cohortes v1 — idempotent
-- Étape 1 : création des tables (toutes) + index + FK
-- Étape 2 : activation RLS
-- Étape 3 : politiques (après que toutes les tables existent)

-- ══════════════════════════════════════════════════════
-- TABLE 0 : public.formation_journeys (prérequis si absente)
-- ══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.formation_journeys (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  title          TEXT NOT NULL,
  slug           TEXT,
  description    TEXT,
  level          TEXT,
  duration_weeks INTEGER,
  price_euros    NUMERIC(10,2),
  status         TEXT DEFAULT 'draft'
);

-- ══════════════════════════════════════════════════════
-- TABLE 1 : public.cohorts
-- ══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.cohorts (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  code                      VARCHAR(30) UNIQUE,
  formation_journey_id      UUID REFERENCES public.formation_journeys(id) ON DELETE RESTRICT,
  intensity                 VARCHAR(20) NOT NULL DEFAULT 'standard',
  start_date                DATE NOT NULL,
  estimated_end_date        DATE,
  weekly_schedule           JSONB NOT NULL DEFAULT '[]',
  total_sessions            INTEGER,
  max_students              INTEGER NOT NULL DEFAULT 5,
  min_students_to_confirm   INTEGER NOT NULL DEFAULT 3,
  status                    VARCHAR(20) NOT NULL DEFAULT 'draft',
  visibility                VARCHAR(20) NOT NULL DEFAULT 'private',
  formateur_id              UUID,
  meeting_url               TEXT,
  exam_blank_1_session      INTEGER,
  exam_blank_2_session      INTEGER,
  exam_blank_3_session      INTEGER,
  notes_internes            TEXT
);

CREATE INDEX IF NOT EXISTS idx_cohorts_status      ON public.cohorts(status);
CREATE INDEX IF NOT EXISTS idx_cohorts_start_date  ON public.cohorts(start_date);
CREATE INDEX IF NOT EXISTS idx_cohorts_journey_id  ON public.cohorts(formation_journey_id);

ALTER TABLE public.cohorts ENABLE ROW LEVEL SECURITY;

-- ══════════════════════════════════════════════════════
-- TABLE 2 : public.cohort_sessions
-- ══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.cohort_sessions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  cohort_id        UUID NOT NULL REFERENCES public.cohorts(id) ON DELETE CASCADE,
  session_number   INTEGER NOT NULL,
  session_date     DATE NOT NULL,
  start_time       TIME NOT NULL,
  end_time         TIME NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 180,
  session_type     VARCHAR(20) NOT NULL DEFAULT 'cours',
  title            VARCHAR(200),
  format           VARCHAR(20) NOT NULL DEFAULT 'visio',
  meeting_url      TEXT,
  location         TEXT,
  status           VARCHAR(20) NOT NULL DEFAULT 'scheduled',
  formateur_id     UUID,
  objectives       TEXT,
  documents        JSONB DEFAULT '[]',
  notes_formateur  TEXT,
  UNIQUE (cohort_id, session_number)
);

CREATE INDEX IF NOT EXISTS idx_csessions_cohort_id ON public.cohort_sessions(cohort_id);
CREATE INDEX IF NOT EXISTS idx_csessions_date      ON public.cohort_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_csessions_type      ON public.cohort_sessions(session_type);

ALTER TABLE public.cohort_sessions ENABLE ROW LEVEL SECURITY;

-- ══════════════════════════════════════════════════════
-- TABLE 3 : public.cohort_enrollments
-- ══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.cohort_enrollments (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  cohort_id        UUID NOT NULL REFERENCES public.cohorts(id) ON DELETE CASCADE,
  lead_id          UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  status           VARCHAR(30) NOT NULL DEFAULT 'pending',
  payment_mode     VARCHAR(30),
  stripe_payment_intent_id TEXT,
  acompte_paid     BOOLEAN DEFAULT FALSE,
  acompte_amount   NUMERIC(10,2),
  solde_due        NUMERIC(10,2),
  total_paid       NUMERIC(10,2) DEFAULT 0,
  stafy_status     VARCHAR(30) DEFAULT 'not_sent',
  stafy_dossier_id TEXT,
  stafy_transmitted_at TIMESTAMPTZ,
  reserved_at      TIMESTAMPTZ DEFAULT now(),
  confirmed_at     TIMESTAMPTZ,
  cancelled_at     TIMESTAMPTZ,
  cancellation_reason TEXT,
  CONSTRAINT uq_enrollment_lead_cohort UNIQUE (cohort_id, lead_id)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_cohort_id ON public.cohort_enrollments(cohort_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_lead_id   ON public.cohort_enrollments(lead_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status    ON public.cohort_enrollments(status);

ALTER TABLE public.cohort_enrollments ENABLE ROW LEVEL SECURITY;

-- ══════════════════════════════════════════════════════
-- TABLE 4 : public.attendance
-- ══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.attendance (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  session_id       UUID NOT NULL REFERENCES public.cohort_sessions(id) ON DELETE CASCADE,
  lead_id          UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  status           VARCHAR(20) NOT NULL DEFAULT 'pending',
  arrival_time     TIMESTAMPTZ,
  duration_minutes INTEGER,
  signature_method VARCHAR(20),
  signed_at        TIMESTAMPTZ,
  ip_address       TEXT,
  notes            TEXT,
  marked_by        UUID,
  CONSTRAINT uq_attendance_session_lead UNIQUE (session_id, lead_id)
);

CREATE INDEX IF NOT EXISTS idx_attendance_session_id ON public.attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_lead_id    ON public.attendance(lead_id);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- ══════════════════════════════════════════════════════
-- ÉTAPE 3 : POLITIQUES RLS (toutes après création des tables)
-- ══════════════════════════════════════════════════════

-- cohorts policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'cohorts'
      AND policyname = 'cohorts: staff full access'
  ) THEN
    CREATE POLICY "cohorts: staff full access" ON public.cohorts
      FOR ALL TO authenticated
      USING (
        public.has_role(auth.uid(), 'admin')
        OR public.has_role(auth.uid(), 'gestionnaire')
      )
      WITH CHECK (
        public.has_role(auth.uid(), 'admin')
        OR public.has_role(auth.uid(), 'gestionnaire')
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'cohorts'
      AND policyname = 'cohorts: public open visible'
  ) THEN
    CREATE POLICY "cohorts: public open visible" ON public.cohorts
      FOR SELECT TO anon, authenticated
      USING (visibility = 'public' AND status IN ('open', 'confirming', 'confirmed'));
  END IF;
END $$;

-- cohort_sessions policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'cohort_sessions'
      AND policyname = 'cohort_sessions: staff full access'
  ) THEN
    CREATE POLICY "cohort_sessions: staff full access" ON public.cohort_sessions
      FOR ALL TO authenticated
      USING (
        public.has_role(auth.uid(), 'admin')
        OR public.has_role(auth.uid(), 'gestionnaire')
      )
      WITH CHECK (
        public.has_role(auth.uid(), 'admin')
        OR public.has_role(auth.uid(), 'gestionnaire')
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'cohort_sessions'
      AND policyname = 'cohort_sessions: inscrit sees own'
  ) THEN
    CREATE POLICY "cohort_sessions: inscrit sees own" ON public.cohort_sessions
      FOR SELECT TO authenticated
      USING (
        cohort_id IN (
          SELECT ce.cohort_id FROM public.cohort_enrollments ce
          JOIN public.leads l ON l.id = ce.lead_id
          WHERE l.email = auth.email()
        )
      );
  END IF;
END $$;

-- cohort_enrollments policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'cohort_enrollments'
      AND policyname = 'enrollments: staff full access'
  ) THEN
    CREATE POLICY "enrollments: staff full access" ON public.cohort_enrollments
      FOR ALL TO authenticated
      USING (
        public.has_role(auth.uid(), 'admin')
        OR public.has_role(auth.uid(), 'gestionnaire')
      )
      WITH CHECK (
        public.has_role(auth.uid(), 'admin')
        OR public.has_role(auth.uid(), 'gestionnaire')
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'cohort_enrollments'
      AND policyname = 'enrollments: inscrit sees own'
  ) THEN
    CREATE POLICY "enrollments: inscrit sees own" ON public.cohort_enrollments
      FOR SELECT TO authenticated
      USING (
        lead_id IN (
          SELECT id FROM public.leads WHERE email = auth.email()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'cohort_enrollments'
      AND policyname = 'enrollments: anon insert'
  ) THEN
    CREATE POLICY "enrollments: anon insert" ON public.cohort_enrollments
      FOR INSERT TO anon, authenticated
      WITH CHECK (true);
  END IF;
END $$;

-- attendance policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'attendance'
      AND policyname = 'attendance: staff full access'
  ) THEN
    CREATE POLICY "attendance: staff full access" ON public.attendance
      FOR ALL TO authenticated
      USING (
        public.has_role(auth.uid(), 'admin')
        OR public.has_role(auth.uid(), 'gestionnaire')
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'attendance'
      AND policyname = 'attendance: inscrit sign own'
  ) THEN
    CREATE POLICY "attendance: inscrit sign own" ON public.attendance
      FOR UPDATE TO authenticated
      USING (
        lead_id IN (SELECT id FROM public.leads WHERE email = auth.email())
      )
      WITH CHECK (
        lead_id IN (SELECT id FROM public.leads WHERE email = auth.email())
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'attendance'
      AND policyname = 'attendance: inscrit read own'
  ) THEN
    CREATE POLICY "attendance: inscrit read own" ON public.attendance
      FOR SELECT TO authenticated
      USING (
        lead_id IN (SELECT id FROM public.leads WHERE email = auth.email())
      );
  END IF;
END $$;

-- ══════════════════════════════════════════════════════
-- FONCTION UTILITAIRE
-- ══════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.get_cohort_enrolled_count(p_cohort_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.cohort_enrollments
  WHERE cohort_id = p_cohort_id
    AND status IN ('confirmed', 'pending');
$$;


-- ────────────────────────────────────────────────────────────
-- Migration: 20260523074536_81d9b633-7954-4cfa-b89f-64ad6d4dab59.sql
-- ────────────────────────────────────────────────────────────
-- Fix search_path sur get_cohort_enrolled_count
CREATE OR REPLACE FUNCTION public.get_cohort_enrolled_count(p_cohort_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.cohort_enrollments
  WHERE cohort_id = p_cohort_id
    AND status IN ('confirmed', 'pending');
$$;

-- ────────────────────────────────────────────────────────────
-- Migration: 20260523082542_3a15d861-1bc4-4d13-8464-18f279a81dd9.sql
-- ────────────────────────────────────────────────────────────
-- Cohorts
DROP POLICY IF EXISTS "cohorts: staff full access" ON public.cohorts;

CREATE POLICY "cohorts: admin full access" ON public.cohorts
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "cohorts: gestionnaire own only" ON public.cohorts
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'gestionnaire')
    AND formateur_id = auth.uid()
  );

CREATE POLICY "cohorts: gestionnaire update own" ON public.cohorts
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'gestionnaire')
    AND formateur_id = auth.uid()
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'gestionnaire')
    AND formateur_id = auth.uid()
  );

-- Cohort sessions
DROP POLICY IF EXISTS "cohort_sessions: staff full access" ON public.cohort_sessions;

CREATE POLICY "cohort_sessions: admin full access" ON public.cohort_sessions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "cohort_sessions: gestionnaire own" ON public.cohort_sessions
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'gestionnaire')
    AND cohort_id IN (
      SELECT id FROM public.cohorts WHERE formateur_id = auth.uid()
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'gestionnaire')
    AND cohort_id IN (
      SELECT id FROM public.cohorts WHERE formateur_id = auth.uid()
    )
  );

-- Cohort enrollments
DROP POLICY IF EXISTS "enrollments: staff full access" ON public.cohort_enrollments;

CREATE POLICY "enrollments: admin full access" ON public.cohort_enrollments
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "enrollments: gestionnaire own cohorts" ON public.cohort_enrollments
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'gestionnaire')
    AND cohort_id IN (
      SELECT id FROM public.cohorts WHERE formateur_id = auth.uid()
    )
  );

-- Attendance
DROP POLICY IF EXISTS "attendance: staff full access" ON public.attendance;

CREATE POLICY "attendance: admin full access" ON public.attendance
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "attendance: gestionnaire own sessions" ON public.attendance
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'gestionnaire')
    AND session_id IN (
      SELECT cs.id FROM public.cohort_sessions cs
      JOIN public.cohorts c ON c.id = cs.cohort_id
      WHERE c.formateur_id = auth.uid()
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'gestionnaire')
    AND session_id IN (
      SELECT cs.id FROM public.cohort_sessions cs
      JOIN public.cohorts c ON c.id = cs.cohort_id
      WHERE c.formateur_id = auth.uid()
    )
  );

-- ────────────────────────────────────────────────────────────
-- Migration: 20260523105449_edaf8a65-b103-49df-9bdf-78bf466f10ef.sql
-- ────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'leads'
      AND column_name = 'prenom'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'leads'
      AND column_name = 'first_name'
  ) THEN
    ALTER TABLE public.leads RENAME COLUMN prenom TO first_name;
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────
-- Migration: 20260523122930_1b5658ac-bf5e-4bcf-910f-bc704de79461.sql
-- ────────────────────────────────────────────────────────────
-- Resserrement RLS dossiers : remplace les policies fallback par des policies has_role() explicites

DROP POLICY IF EXISTS "Staff can read dossiers" ON public.dossiers;
DROP POLICY IF EXISTS "Staff can update dossiers" ON public.dossiers;

-- Les policies fallback "USING (true)" peuvent rester si has_role n'existait pas encore.
-- On les remplace par des policies strictes maintenant que has_role() est garanti.

CREATE POLICY "dossiers: staff read" ON public.dossiers
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'gestionnaire')
    OR public.has_role(auth.uid(), 'conseiller')
  );

CREATE POLICY "dossiers: staff update" ON public.dossiers
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'gestionnaire')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'gestionnaire')
  );

-- La policy INSERT anon reste inchangée.
