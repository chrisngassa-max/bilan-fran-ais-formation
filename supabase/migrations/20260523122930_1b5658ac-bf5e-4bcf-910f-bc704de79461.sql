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