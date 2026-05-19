import { getRecommendedJourneyServer } from "./formation-offers.server";
import { NiveauIndicatif } from "@/types/bilan";

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
    cta_label: "Vérifier mon dossier préfecture",
    cta_url_template: "{MAGIC_LINK}",
  },
  {
    jour: 7,
    sujet: "Avez-vous simulé votre reste à charge ?",
    cta_label: "Calculer mon reste à charge",
    cta_url_template: "{MAGIC_LINK}",
  },
  {
    jour: 14,
    sujet: "Clôture imminente de votre session de formation",
    cta_label: "Démarrer ma formation ce mois-ci",
    cta_url_template: "{MAGIC_LINK}",
  },
];

export function buildCTAUrl(template: EmailTemplate, magicLink: string): string {
  return template.cta_url_template.replace("{MAGIC_LINK}", magicLink);
}

interface Lead {
  first_name: string;
  estimated_level?: string | null;
}

/**
 * Génère le corps de l'email HTML premium selon le jour de la relance.
 */
export async function buildSequenceEmailHtml(jour: 3 | 7 | 14, lead: Lead, magicLink: string): Promise<string> {
  const level = (lead.estimated_level as NiveauIndicatif) || "A2";
  const journey = await getRecommendedJourneyServer(level);

  let title = "";
  let intro = "";
  let body = "";
  let ctaLabel = "";
  let ctaUrl = magicLink;

  if (jour === 3) {
    title = "Mon dossier administratif est-il complet ?";
    intro = `Bonjour ${lead.first_name}, <br><br>Un document manquant ou mal rempli en préfecture peut retarder votre demande de carte de séjour ou de naturalisation de plusieurs mois.`;
    body = `
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 12px; margin: 20px 0;">
        <h4 style="margin-top:0; color:#0f172a;">📋 Vos pièces justificatives</h4>
        <p style="font-size:13px; color:#475569; margin-bottom:10px;">
          Votre niveau estimé <strong>${level}</strong> correspond au parcours <strong>${journey.name}</strong>. Avez-vous rassemblé les pièces suivantes ?
        </p>
        <ul style="font-size:12px; color:#475569; padding-left:20px; line-height:1.5;">
          <li>Justificatif d'identité en cours de validité</li>
          <li>Justificatif de domicile de moins de 3 mois</li>
          <li>Timbre fiscal électronique correspondant à la démarche</li>
          <li>Attestation de réussite linguistique (niveau visé : ${journey.examTarget})</li>
        </ul>
      </div>
      <p style="font-size:13px; color:#475569;">
        Nos partenaires administratifs peuvent analyser vos pièces justificatives afin d'éviter tout rejet de votre dossier en préfecture.
      </p>
    `;
    ctaLabel = "🔎 Faire vérifier mon dossier administrativement";
  } else if (jour === 7) {
    title = "Simulation de votre financement & Reste à charge";
    intro = `Bonjour ${lead.first_name}, <br><br>Le prix public du parcours <strong>${journey.name}</strong> est de ${journey.publicPrice} €. Cependant, de nombreux financements existent pour alléger ce coût.`;
    body = `
      <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; padding: 20px; border-radius: 12px; margin: 20px 0; color: #065f46;">
        <h4 style="margin-top:0; color:#047857;">💰 Financements Mobilisables</h4>
        <p style="font-size:13px; margin-bottom:10px;">
          Selon votre situation professionnelle (salarié, demandeur d'emploi, indépendant), le <strong>tarif financé de référence</strong> peut être abaissé à <strong>${journey.financedReferencePrice} €</strong>, avec une prise en charge possible de vos droits CPF.
        </p>
        <p style="font-size:12px; font-weight: bold; margin: 0;">
          Mensualité maximale en 3x sans frais : ${journey.monthlyInstallment} €/mois.
        </p>
      </div>
      <p style="font-size:13px; color:#475569;">
        Remplissez notre court simulateur pour recevoir votre reste à charge exact calculé en fonction de vos droits CPF actuels.
      </p>
    `;
    ctaLabel = "💵 Calculer mon reste à charge exact";
  } else {
    // J+14
    title = "Dernière chance pour réserver votre formateur référent";
    intro = `Bonjour ${lead.first_name}, <br><br>Afin de garantir une qualité d'apprentissage optimale, nos groupes sont strictement limités à <strong>6 élèves maximum</strong>.`;
    body = `
      <div style="background-color: #fffbeb; border: 1px solid #fde68a; padding: 20px; border-radius: 12px; margin: 20px 0; color: #92400e;">
        <h4 style="margin-top:0; color:#b45309;">⚠️ Clôture de session imminente</h4>
        <p style="font-size:13px; margin-bottom:10px;">
          Les places pour le parcours <strong>${journey.name}</strong> de ce mois-ci sont presque toutes réservées. Il ne reste plus que 2 créneaux d'accompagnement individuel disponibles avec nos formateurs référents.
        </p>
        <p style="font-size:12px; margin: 0;">
          Rappel de la formation : ${journey.hours}h · Objectif ${journey.examTarget} · Sous réserve de 6 inscrits.
        </p>
      </div>
      <p style="font-size:13px; color:#475569;">
        Sécurisez votre place aujourd'hui sans avancer aucun frais avant validation de votre éligibilité.
      </p>
    `;
    ctaLabel = "🎯 Sécuriser ma place au cours de français";
  }

  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #334155; line-height: 1.6; padding: 20px;">
      <div style="text-align: center; margin-bottom: 25px; border-bottom: 1px solid #f1f5f9; padding-bottom: 20px;">
        <h2 style="color: #0f172a; font-size: 22px; font-weight: 900; margin: 0;">Bilan Français Formation</h2>
      </div>

      <h3 style="color: #0f172a; font-size: 18px; font-weight: 800; margin-bottom: 15px;">${title}</h3>

      <p style="font-size: 14px; color: #475569;">
        ${intro}
      </p>

      ${body}

      <div style="text-align: center; margin: 30px 0;">
        <a href="${ctaUrl}" style="display: inline-block; background-color: #ea580c; color: #fff; text-decoration: none; padding: 16px 24px; border-radius: 12px; font-weight: bold; font-size: 15px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
          ${ctaLabel}
        </a>
      </div>

      <p style="font-size: 12px; color: #64748b; text-align: center; margin-top: 30px;">
        Zéro engagement. Financement vérifié par téléphone sous 24h.
      </p>

      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0 20px 0;">
      <p style="font-size: 10px; color: #94a3b8; text-align: center;">
        Vous recevez cet email car vous avez effectué un test de positionnement en français. <br>
        <a href="${magicLink}" style="color: #ea580c; text-decoration: underline;">Se désinscrire de cette liste</a>.
      </p>
    </div>
  `;
}
