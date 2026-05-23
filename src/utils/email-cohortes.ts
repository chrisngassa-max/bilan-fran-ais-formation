import { Resend } from "resend";

const resendKey = process.env.RESEND_API_KEY || "";
const resend = resendKey ? new Resend(resendKey) : null;

const FROM = "Bilan Français Formation <bilan@bilanfrancaisformation.fr>";
const SITE = "https://bilanfrancaisformation.fr";

function wrapHtml(inner: string, subtitle: string): string {
  return `
  <div style="font-family: -apple-system, system-ui, sans-serif; max-width: 600px; margin: 0 auto; color: #334155; line-height: 1.6; padding: 24px; background:#ffffff;">
    <div style="text-align: center; margin-bottom: 24px;">
      <h2 style="color:#0f172a; font-size:22px; font-weight:900; margin:0 0 4px;">Bilan Français Formation</h2>
      <p style="color:#64748b; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; margin:0;">${subtitle}</p>
    </div>
    ${inner}
    <hr style="border:0; border-top:1px solid #e2e8f0; margin:36px 0 18px;">
    <p style="font-size:11px; color:#94a3b8; text-align:center;">
      Organisme agréé. RGPD compliant. Vous pouvez demander la suppression de vos données ou
      <a href="${SITE}/unsubscribe" style="color:#ea580c; text-decoration:underline;">vous désinscrire</a> à tout moment.
    </p>
  </div>`;
}

const recapRow = (label: string, value: string) => `
  <tr>
    <td style="color:#64748b; font-size:13px; padding:6px 12px 6px 0; vertical-align:top;">${label}</td>
    <td style="color:#0f172a; font-size:13px; font-weight:700; padding:6px 0;">${value}</td>
  </tr>`;

export interface ConfirmationReservationData {
  email: string;
  first_name: string;
  cohort_code: string;
  journey_name: string;
  start_date: string;
  weekly_schedule_text: string;
  meeting_url?: string;
  payment_mode: string;
  is_waiting_list: boolean;
}

export async function envoyerEmailConfirmationReservation(
  data: ConfirmationReservationData,
): Promise<void> {
  if (!resend) {
    console.error("[envoyerEmailConfirmationReservation] RESEND_API_KEY missing — skipping.");
    return;
  }
  if (!data.email) {
    console.error("[envoyerEmailConfirmationReservation] No recipient email.");
    return;
  }

  const subject = data.is_waiting_list
    ? `Liste d'attente enregistrée — ${data.journey_name}`
    : `Réservation confirmée — ${data.journey_name} · ${data.cohort_code}`;

  const greeting = `<h3 style="color:#0f172a; font-size:18px; font-weight:800; margin:0 0 12px;">Bonjour ${data.first_name || ""},</h3>`;

  const body = data.is_waiting_list
    ? `
      <p style="font-size:14px; color:#475569;">
        Votre inscription en <strong>liste d'attente</strong> pour la session
        <strong>${data.cohort_code}</strong> a bien été enregistrée. Nous vous contacterons dès qu'une place se libère.
      </p>
      <div style="background:#f1f5f9; border-left:4px solid #0f172a; padding:14px 18px; border-radius:8px; margin:18px 0;">
        <p style="margin:0; font-size:13px; color:#0f172a;">
          <strong>Parcours :</strong> ${data.journey_name}
        </p>
      </div>`
    : `
      <p style="font-size:14px; color:#475569; margin-bottom:18px;">
        Votre réservation pour la session <strong>${data.cohort_code}</strong> a bien été enregistrée. Voici le récapitulatif :
      </p>
      <div style="background:#f8fafc; border:1px solid #e2e8f0; padding:16px 20px; border-radius:12px; margin-bottom:18px;">
        <table style="width:100%; border-collapse:collapse;">
          ${recapRow("Parcours", data.journey_name)}
          ${recapRow("Démarrage", data.start_date)}
          ${recapRow("Créneaux", data.weekly_schedule_text || "À confirmer")}
          ${data.meeting_url ? recapRow("Lien visio", `<a href="${data.meeting_url}" style="color:#ea580c;">${data.meeting_url}</a>`) : ""}
        </table>
      </div>
      <div style="background:#ecfdf5; border:1px solid #a7f3d0; padding:14px 18px; border-radius:12px; color:#065f46; font-size:13px; margin-bottom:18px;">
        <strong>Mode de financement choisi :</strong> ${data.payment_mode}
        ${["cpf", "opco", "france_travail"].includes(data.payment_mode)
          ? "<br><span style=\"font-size:12px;\">Un conseiller vous contactera sous 48h pour le montage de votre dossier de financement.</span>"
          : ""}
      </div>`;

  const cta = `
    <div style="text-align:center; margin:24px 0 8px;">
      <a href="${SITE}/mon-espace/ma-cohorte" style="display:inline-block; background:#ea580c; color:#fff; text-decoration:none; padding:14px 28px; border-radius:12px; font-weight:700; font-size:15px;">
        Accéder à mon espace →
      </a>
    </div>`;

  const html = wrapHtml(greeting + body + cta, "Confirmation de réservation");

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: data.email,
      subject,
      html,
    });
    if (error) {
      console.error("[envoyerEmailConfirmationReservation] Resend error", error);
      throw error;
    }
  } catch (e) {
    console.error("[envoyerEmailConfirmationReservation] Failed", e);
    throw e;
  }
}

export interface RappelVeilleSeanceData {
  email: string;
  first_name: string;
  session_id: string;
  session_number: number;
  session_date: string;
  start_time: string;
  end_time: string;
  meeting_url?: string;
  cohort_code: string;
}

export async function envoyerRappelVeilleSeance(
  data: RappelVeilleSeanceData,
): Promise<void> {
  if (!resend) {
    console.error("[envoyerRappelVeilleSeance] RESEND_API_KEY missing — skipping.");
    return;
  }
  if (!data.email) return;

  const subject = `Rappel — Séance ${data.session_number} demain · ${data.cohort_code}`;

  const startHm = data.start_time.slice(0, 5);
  const endHm = data.end_time.slice(0, 5);

  const greeting = `<h3 style="color:#0f172a; font-size:18px; font-weight:800; margin:0 0 12px;">
    Bonjour ${data.first_name || ""}, votre séance ${data.session_number} est demain !
  </h3>`;

  const recap = `
    <div style="background:#f8fafc; border:1px solid #e2e8f0; padding:16px 20px; border-radius:12px; margin:18px 0;">
      <table style="width:100%; border-collapse:collapse;">
        ${recapRow("Date", data.session_date)}
        ${recapRow("Horaires", `${startHm} – ${endHm}`)}
        ${recapRow("Durée", "3h")}
      </table>
    </div>`;

  const visioBlock = data.meeting_url
    ? `<div style="text-align:center; margin:24px 0;">
        <a href="${data.meeting_url}" style="display:inline-block; background:#16a34a; color:#fff; text-decoration:none; padding:14px 28px; border-radius:12px; font-weight:700; font-size:15px;">
          Rejoindre la visio →
        </a>
      </div>`
    : `<p style="text-align:center; color:#475569; font-size:14px;">Rendez-vous au lieu habituel.</p>`;

  const emargement = `
    <p style="text-align:center; margin-top:18px;">
      <a href="${SITE}/mon-espace/emargement/${data.session_id}" style="color:#ea580c; font-weight:700; text-decoration:underline; font-size:13px;">
        Pensez à émarger votre présence →
      </a>
    </p>`;

  const html = wrapHtml(greeting + recap + visioBlock + emargement, "Rappel de séance");

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: data.email,
      subject,
      html,
    });
    if (error) {
      console.error("[envoyerRappelVeilleSeance] Resend error", error);
      throw error;
    }
  } catch (e) {
    console.error("[envoyerRappelVeilleSeance] Failed", e);
    throw e;
  }
}
