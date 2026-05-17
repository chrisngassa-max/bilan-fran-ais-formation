-- Contrainte unique nécessaire pour les upsert onConflict des fonctions partenaire
CREATE UNIQUE INDEX IF NOT EXISTS leads_partenaire_status_lead_partenaire_uniq
  ON public.leads_partenaire_status (lead_id, partenaire_id);

-- Index utiles pour les lectures du dashboard
CREATE INDEX IF NOT EXISTS lead_partenaire_assignments_partenaire_idx
  ON public.lead_partenaire_assignments (partenaire_id);
CREATE INDEX IF NOT EXISTS leads_partenaire_status_partenaire_idx
  ON public.leads_partenaire_status (partenaire_id);