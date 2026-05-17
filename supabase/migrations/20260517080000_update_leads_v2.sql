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
