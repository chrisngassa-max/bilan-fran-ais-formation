import { Resend } from "resend";
import { getRecommendedJourney } from "@/data/pricing";
import { NiveauIndicatif } from "@/types/bilan";

// Utiliser RESEND_API_KEY depuis process.env
const resendKey = process.env.RESEND_API_KEY || "";
const resend = resendKey ? new Resend(resendKey) : null;

export interface Lead {
  id: string;
  first_name: string;
  last_name?: string | null;
  email: string | null;
  whatsapp_phone?: string | null;
  estimated_level?: string | null;
  goal?: string | null;
  consent_training: boolean;
  consent_partner: boolean;
  consent_training_text_version?: string | null;
  consent_partner_text_version?: string | null;
  consent_timestamp?: string | null;
  status?: string | null;
  partner_status?: string | null;
}

/**
 * Génère le contenu dynamique du parcours recommandé pour l'email.
 */
export function buildJourneyEmailContent(level: NiveauIndicatif, first_name: string, attemptId: string) {
  const journey = getRecommendedJourney(level);
  
  const qualificationUrl = attemptId 
    ? `https://bilanfrancaisformation.fr/qualification/${attemptId}`
    : `https://bilanfrancaisformation.fr/accompagnement-administratif`;

  const formationsUrl = "https://bilanfrancaisformation.fr/formations";

  return `
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 25px; border-radius: 16px; margin: 25px 0; font-family: sans-serif;">
      <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #ea580c; background-color: rgba(234, 88, 12, 0.08); padding: 4px 10px; border-radius: 6px; display: inline-block; margin-bottom: 12px;">
        Votre recommandation académique
      </span>
      <h3 style="margin-top: 0; margin-bottom: 8px; font-size: 20px; font-weight: 900; color: #0f172a;">
        Parcours ${journey.name}
      </h3>
      <p style="font-size: 14px; font-style: italic; color: #475569; margin-bottom: 20px;">
        "${journey.objective}"
      </p>

      <div style="border-top: 1px solid #cbd5e1; border-bottom: 1px solid #cbd5e1; padding: 15px 0; margin-bottom: 20px;">
        <p style="font-size: 13px; font-weight: 700; color: #334155; margin: 0 0 10px 0;">
          📚 Structure Pédagogique
        </p>
        <ul style="margin: 0; padding-left: 20px; font-size: 12px; color: #475569; line-height: 1.5;">
          <li><strong>${journey.hours}h de formation</strong> (${journey.sessions} séances de travail)</li>
          <li><strong>1 formateur référent</strong> - petits groupes de 6 élèves maximum</li>
          <li>Préparation certifiante : ${journey.examTarget}</li>
        </ul>
      </div>

      <div style="background-color: #fff; border: 1px solid #e2e8f0; padding: 15px; border-radius: 12px; margin-bottom: 25px;">
        <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
          <tr>
            <td style="color: #64748b; padding: 4px 0;">Prix public :</td>
            <td style="text-align: right; font-weight: 700; color: #334155; padding: 4px 0;">${journey.publicPrice} €</td>
          </tr>
          <tr style="border-bottom: 1px dashed #e2e8f0;">
            <td style="color: #64748b; padding: 4px 0; font-weight: bold;">Tarif financé de référence :</td>
            <td style="text-align: right; font-weight: 900; color: #16a34a; padding: 4px 0;">${journey.financedReferencePrice} €</td>
          </tr>
          <tr>
            <td style="color: #0f172a; padding: 8px 0 0 0; font-weight: bold;">Mensualité (3x sans frais) :</td>
            <td style="text-align: right; font-weight: 900; color: #0f172a; font-size: 15px; padding: 8px 0 0 0;">${journey.monthlyInstallment} €/mois</td>
          </tr>
        </table>
      </div>

      <div style="space-y: 10px; text-align: center;">
        <a href="${qualificationUrl}" style="display: block; background-color: #ea580c; color: #fff; text-decoration: none; padding: 14px 20px; border-radius: 12px; font-weight: bold; font-size: 15px; margin-bottom: 10px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
          💰 Étape 1 — Vérifier mon financement
        </a>
        <a href="${formationsUrl}" style="display: block; border: 2px solid #0f172a; color: #0f172a; text-decoration: none; padding: 12px 20px; border-radius: 12px; font-weight: bold; font-size: 14px;">
          🔎 Étape 2 — Voir la fiche détaillée du parcours
        </a>
      </div>
    </div>
  `;
}

export async function envoyerEmailBilan(lead: Lead): Promise<void> {
  if (!resend) {
    console.error("[envoyerEmailBilan] Resend API key is missing. Skipping email send.");
    return;
  }

  if (!lead.email) {
    console.error("[envoyerEmailBilan] Lead has no email address. Skipping email send.");
    return;
  }

  try {
    const level = (lead.estimated_level as NiveauIndicatif) || "A2";
    const journeyContent = buildJourneyEmailContent(level, lead.first_name, lead.id);

    const { data, error } = await resend.emails.send({
      from: "Bilan Français Formation <bilan@bilanfrancaisformation.fr>",
      to: lead.email,
      subject: `Votre bilan officiel de niveau de français (${level})`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #334155; line-height: 1.6; padding: 20px;">
          <div style="text-align: center; margin-bottom: 25px;">
            <h2 style="color: #0f172a; font-size: 24px; font-weight: 900; margin-bottom: 5px;">Bilan Français Formation</h2>
            <p style="color: #64748b; font-size: 13px; font-weight: 700; text-transform: uppercase; margin: 0;">Rapport de positionnement</p>
          </div>

          <h3 style="color: #0f172a; font-size: 18px; font-weight: 800;">Bonjour ${lead.first_name},</h3>

          <p style="font-size: 14px; color: #475569;">
            Félicitations pour avoir complété votre évaluation de français. Nos algorithmes académiques ont analysé vos réponses et déterminé votre niveau indicatif.
          </p>

          <div style="background-color: #f1f5f9; border-left: 4px solid #0f172a; padding: 15px 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; font-weight: 700; color: #0f172a;">
              Niveau estimé : <span style="font-size: 18px; color: #ea580c; font-weight: 900;">${level}</span> (CECRL)
            </p>
          </div>

          <!-- PARCOURS ET PRIX DYNAMIQUES -->
          ${journeyContent}

          ${lead.consent_partner ? `
          <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; padding: 15px; border-radius: 12px; color: #065f46; font-size: 13px; font-weight: 600; margin-top: 25px;">
            💼 <strong>Accompagnement préfecture :</strong> Vous avez demandé la vérification gratuite de vos pièces. Un conseiller expert prendra contact avec vous prochainement par téléphone ou WhatsApp.
          </div>
          ` : ""}

          <div style="background-color: #fef2f2; border: 1px solid #fee2e2; padding: 15px; border-radius: 12px; color: #991b1b; font-size: 11px; margin-top: 25px; line-height: 1.5;">
            <strong>Avertissement pédagogique :</strong> Ce rapport de positionnement est purement indicatif et basé sur vos réponses déclarées. Il ne constitue pas un certificat officiel de langue (TCF, DELF) et ne peut en aucun cas être produit seul en préfecture.
          </div>

          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 40px 0 20px 0;">
          <p style="font-size: 11px; color: #94a3b8; text-align: center;">
            Organisme agréé. RGPD compliant. Vous pouvez demander la suppression de vos données à tout moment conformément à la loi informatique et libertés.
          </p>
        </div>
      `
    });

    if (error) {
      console.error("[envoyerEmailBilan] Resend API error", error);
      throw error;
    }

    console.log("[envoyerEmailBilan] Email sent successfully", data);
  } catch (err) {
    console.error("[envoyerEmailBilan] Failed to send email", err);
    throw err;
  }
}
