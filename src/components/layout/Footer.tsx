import { Link } from "@tanstack/react-router";
import { contactInfo, mailHref, phoneHref, siteName, waHref } from "@/config/site";
import { trackEvent } from "@/lib/analytics";
import { MessageCircle } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-surface-container border-t border-outline-variant w-full">
      <div className="w-full py-8 px-4 md:px-8 max-w-[1200px] mx-auto flex flex-col md:flex-row justify-between gap-6 items-center">
        <div className="text-xl font-bold text-on-surface">{siteName}</div>
        <div className="flex flex-wrap justify-center gap-6">
          <Link to="/mentions-legales" className="text-sm text-on-surface-variant hover:text-primary transition-colors">
            Mentions Légales
          </Link>
          <Link to="/confidentialite" className="text-sm text-on-surface-variant hover:text-primary transition-colors">
            Politique de Confidentialité
          </Link>
          <Link to="/contact" className="text-sm text-on-surface-variant hover:text-primary transition-colors">
            Contact
          </Link>
          <a
            href={waHref()}
            target="_blank"
            rel="noreferrer"
            onClick={() => trackEvent("whatsapp_clicked")}
            className="text-sm text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </a>
        </div>
        <div className="text-sm text-on-surface-variant">© {new Date().getFullYear()} {siteName}. Tous droits réservés.</div>
      </div>
      <div className="border-t border-outline-variant/30 px-4 py-4 max-w-[1200px] mx-auto text-center md:text-left">
        <p className="text-sm text-on-surface-variant/70">
          Les informations proposées sont générales et ne remplacent pas l'avis d'une administration, d'un avocat ou d'un conseiller juridique.
        </p>
      </div>
    </footer>
  );
}
