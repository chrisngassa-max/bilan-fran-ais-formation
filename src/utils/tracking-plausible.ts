// Événements Plausible à implémenter

type PlausibleEvent =
  | "test_started"
  | "test_completed"
  | "result_viewed"
  | "lead_capture_submitted"
  | "lead_capture_succeeded"
  | "lead_capture_failed"
  | "partner_interest_checked"
  | "partner_page_viewed"
  | "partner_lead_submitted"
  | "partner_lead_succeeded"
  | "partner_lead_failed"
  | "whatsapp_clicked"
  | "cpf_link_clicked"
  | "export_downloaded"
  | "dispense_verifiee"
  // Patch 10
  | "hero_cta_click"
  | "test_start"
  | "test_question_answered"
  | "lead_form_view"
  | "lead_submitted"
  | "diag_start"
  | "diag_step_completed"
  | "diag_completed"
  | "parcours_click"
  | "inscription_click"
  | "financement_cta_click"
  | "demarche_selected"
  | "checklist_item_checked"
  | "dispense_demandee"

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Record<string, unknown> }) => void;
  }
}

export function track(event: PlausibleEvent, props?: Record<string, string>) {
  if (typeof window === "undefined") return;
  
  if (typeof window.plausible === "function") {
    window.plausible(event, props ? { props } : undefined);
  } else if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log("[Plausible DEV Tracking]", event, props ?? {});
  }
}
