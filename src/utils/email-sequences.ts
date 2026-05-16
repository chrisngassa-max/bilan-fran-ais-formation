export interface EmailTemplate {
  jour: 0 | 3 | 7 | 14
  sujet: string
  cta_label: string
  cta_url: string
}

export const EMAIL_SEQUENCES: EmailTemplate[] = [
  {
    jour: 0,
    sujet: "Votre niveau de positionnement — résultats et prochaines étapes",
    cta_label: "Voir mes formations disponibles",
    cta_url: "/formations?utm_source=email&utm_campaign=j0"
  },
  {
    jour: 3,
    sujet: "Votre dossier administratif est-il complet ?",
    cta_label: "Faire vérifier mon dossier",
    cta_url: "/dossier?utm_source=email&utm_campaign=j3"
  },
  {
    jour: 7,
    sujet: "Avez-vous vérifié votre financement ?",
    cta_label: "Calculer mon financement",
    cta_url: "/financement?utm_source=email&utm_campaign=j7"
  },
  {
    jour: 14,
    sujet: "Dernière étape avant votre rendez-vous préfecture",
    cta_label: "Démarrer ma formation",
    cta_url: "/formations?utm_source=email&utm_campaign=j14"
  }
]
