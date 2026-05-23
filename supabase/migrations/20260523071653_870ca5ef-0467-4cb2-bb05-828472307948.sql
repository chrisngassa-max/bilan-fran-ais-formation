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