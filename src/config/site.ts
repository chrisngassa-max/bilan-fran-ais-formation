export const fundingMode: "qualiopi_direct" | "partner_qualiopi" | "no_qualiopi_yet" =
  "no_qualiopi_yet";

export const contactInfo = {
  whatsapp: "33000000000", // TODO (P0): BLOQUANT AVANT PROD - Remplacer par un vrai numéro
  phone: "33000000000", // TODO (P0): BLOQUANT AVANT PROD - Remplacer par un vrai numéro
  email: "contact@bilanfrancaisformation.fr",
  city: "France",
};

export const siteUrl = "https://bilanfrancaisformation.fr"; // TODO: confirmer

export const siteName = "Bilan Français Formation";

export const phoneHref = `tel:+${contactInfo.phone}`;
export const mailHref = `mailto:${contactInfo.email}`;
export const waHref = (text?: string) =>
  `https://wa.me/${contactInfo.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
