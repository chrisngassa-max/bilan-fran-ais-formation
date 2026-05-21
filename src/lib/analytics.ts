// Plausible Analytics wrapper (cookie-less).
declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Record<string, unknown> }) => void;
  }
}

export type AnalyticsEvent =
  | "test_started"
  | "test_completed"
  | "lead_capture_submitted"
  | "lead_capture_succeeded"
  | "lead_capture_failed"
  | "whatsapp_clicked"
  | "phone_clicked"
  | "page_view"
  | "landing_cta_click"
  | "home_diagnostic_click"
  // Legacy (kept for compatibility)
  | "simulator_started"
  | "simulator_step_completed"
  | "simulator_completed"
  | "result_viewed"
  | "contact_form_submitted"
  | "admin_lead_capture_submitted"
  | "admin_lead_capture_succeeded"
  | "admin_lead_capture_failed"
  | "formations_cta_click"
  | "home_t1_click"
  | "home_t2_click"
  | "home_t3_click"
  | "test_rapide_started"
  | "test_rapide_completed"
  | "test_rapide_contact_submitted";

export function trackEvent(name: AnalyticsEvent, props?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  if (typeof window.plausible === "function") {
    window.plausible(name, props ? { props } : undefined);
  } else if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log("[analytics]", name, props ?? {});
  }
}
