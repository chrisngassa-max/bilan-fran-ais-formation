import { Link } from "@tanstack/react-router";
import { contactInfo, mailHref, phoneHref, siteName, waHref } from "@/config/site";
import { trackEvent } from "@/lib/analytics";

export function Footer() {
  return (
    <footer className="border-t border-outline-variant bg-surface-container">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-3">
        <div>
          <p className="font-semibold text-on-surface">{siteName}</p>
          <p className="mt-2 body-md text-on-surface-variant">
            Évaluation, orientation et préparation en français pour vos projets en France.
          </p>
        </div>

        <div>
          <h2 className="label-caps text-on-surface-variant">Contact</h2>
          <ul className="mt-3 space-y-2 body-md">
            <li>
              <a
                href={phoneHref}
                onClick={() => trackEvent("phone_clicked")}
                className="text-on-surface hover:text-primary"
              >
                Téléphone
              </a>
            </li>
            <li>
              <a href={mailHref} className="text-on-surface hover:text-primary">
                {contactInfo.email}
              </a>
            </li>
            <li>
              <a
                href={waHref()}
                target="_blank"
                rel="noreferrer"
                onClick={() => trackEvent("whatsapp_clicked")}
                className="text-on-surface hover:text-primary"
              >
                WhatsApp
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="label-caps text-on-surface-variant">Informations</h2>
          <ul className="mt-3 space-y-2 body-md">
            <li>
              <Link to="/mentions-legales" className="text-on-surface hover:text-primary">
                Mentions légales
              </Link>
            </li>
            <li>
              <Link to="/confidentialite" className="text-on-surface hover:text-primary">
                Confidentialité
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-outline-variant px-4 py-6">
        <p className="mx-auto max-w-6xl body-md text-on-surface-variant">
          Les informations proposées sont générales et ne remplacent pas l'avis d'une
          administration, d'un avocat ou d'un conseiller juridique.
        </p>
      </div>
    </footer>
  );
}
