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
