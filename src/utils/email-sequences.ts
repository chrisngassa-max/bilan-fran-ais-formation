/**
 * IMPORTANT : appeler `genererMagicLink(lead_id)` à CHAQUE envoi d'email.
 * Le token est à USAGE UNIQUE et valide 30 jours. Substituer `{MAGIC_LINK}`
 * dans `cta_url_template` via `buildCTAUrl()` juste avant l'envoi.
 */

export interface EmailTemplate {
  jour: 0 | 3 | 7 | 14;
  sujet: string;
  cta_label: string;
  /** Template d'URL — contient `{MAGIC_LINK}` à substituer. */
  cta_url_template: string;
}

export const EMAIL_SEQUENCES: EmailTemplate[] = [
  {
    jour: 0,
    sujet: "Votre niveau de positionnement — résultats et prochaines étapes",
    cta_label: "Accéder à mon espace →",
    cta_url_template: "{MAGIC_LINK}",
  },
  {
    jour: 3,
    sujet: "Votre dossier administratif est-il complet ?",
    cta_label: "Mettre à jour ma checklist →",
    cta_url_template: "{MAGIC_LINK}",
  },
  {
    jour: 7,
    sujet: "Avez-vous vérifié votre financement ?",
    cta_label: "Calculer mon financement",
    cta_url_template: "{MAGIC_LINK}",
  },
  {
    jour: 14,
    sujet: "Dernière étape avant votre rendez-vous préfecture",
    cta_label: "Démarrer ma formation",
    cta_url_template: "{MAGIC_LINK}",
  },
];

export function buildCTAUrl(template: EmailTemplate, magicLink: string): string {
  return template.cta_url_template.replace("{MAGIC_LINK}", magicLink);
}
