import { Resend } from "resend";

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
    const { data, error } = await resend.emails.send({
      from: "Bilan Français Formation <bilan@bilanfrancaisformation.fr>",
      to: lead.email,
      subject: "Votre bilan de positionnement en français",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
          <h2 style="color: #ea580c;">Bonjour ${lead.first_name},</h2>

          <p>Votre bilan de positionnement est prêt.</p>

          <div style="background-color: #f7fee7; border: 1px solid #d9f99d; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #3f6212;">Votre niveau estimé : ${lead.estimated_level ?? "En cours d'analyse"}</h3>
            <p style="margin-bottom: 0; font-size: 14px; color: #4d7c0f;">
              <strong>⚠️ Ce résultat est indicatif.</strong><br>
              Il ne remplace pas une certification officielle (TCF, DELF, TEF) et ne peut pas être présenté en préfecture.
            </p>
          </div>

          <h3>Prochaines étapes</h3>
          <ul>
            <li>Consultez les formations disponibles adaptées à votre niveau</li>
            <li>Vérifiez votre éligibilité à un financement (CPF, AIF...)</li>
            <li>Vérifiez que votre dossier préfecture est complet</li>
          </ul>

          ${lead.consent_partner ? `
          <p style="background-color: #f0fdfa; border: 1px solid #99f6e4; padding: 15px; border-radius: 8px; color: #0f766e;">
            Vous avez demandé à être contacté(e) pour votre dossier administratif. Un conseiller expert vous recontactera prochainement.
          </p>
          ` : ""}

          <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="font-size:12px;color:#888;">
            Conformément à notre 
            <a href="https://bilanfrancaisformation.fr/confidentialite" style="color: #ea580c; text-decoration: underline;">
              politique de confidentialité
            </a>, vous pouvez demander la suppression de vos données à tout moment.
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
