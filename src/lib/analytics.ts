// Plausible Analytics wrapper (cookie-less, pas de bandeau requis pour l'analytics seul).
// TODO: ajouter dans index.html une fois le domaine actif :
// <script defer data-domain="bilanfrancaisformation.fr" src="https://plausible.io/js/script.js"></script>

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Record<string, unknown> }) => void;
  }
}

export type AnalyticsEvent =
  | "simulator_started"
  | "simulator_step_completed"
  | "simulator_completed"
  | "result_viewed"
  | "contact_form_submitted"
  | "whatsapp_clicked"
  | "phone_clicked"
  | "page_view"
  | "landing_cta_click";

export function trackEvent(name: AnalyticsEvent, props?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  if (typeof window.plausible === "function") {
    window.plausible(name, props ? { props } : undefined);
  } else if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log("[analytics]", name, props ?? {});
  }
}
