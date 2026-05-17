
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
  ADD COLUMN IF NOT EXISTS partenaire_consent BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS partenaire_consent_at TIMESTAMPTZ,
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
