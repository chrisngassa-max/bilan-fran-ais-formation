-- RGPD Compliance: Reset forced consent flag for leads created before May 18, 2026
UPDATE public.leads
SET partenaire_consent = false,
    partenaire_consent_at = null,
    partner_id = null,
    partner_status = 'pending'
WHERE created_at < '2026-05-18T00:00:00Z'
  AND partenaire_consent = true;
