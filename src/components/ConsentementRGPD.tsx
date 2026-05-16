import { Link } from "@tanstack/react-router"

interface Props {
  show_whatsapp_consent: boolean  // true si whatsapp renseigné
  onConsentChange: (partenaire: boolean, whatsapp: boolean) => void
  partenaire_consent: boolean
  whatsapp_consent: boolean
}

export function ConsentementRGPD({ 
  show_whatsapp_consent, 
  onConsentChange, 
  partenaire_consent, 
  whatsapp_consent 
}: Props) {
  return (
    <div className="space-y-4 py-4 border-t border-outline-variant">
      <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-surface-container transition-colors">
        <input
          type="checkbox"
          checked={partenaire_consent}
          onChange={(e) => onConsentChange(e.target.checked, whatsapp_consent)}
          className="mt-1 h-5 w-5 accent-primary shrink-0"
        />
        <span className="text-sm text-on-surface-variant leading-relaxed">
          J'accepte que mes informations soient transmises au partenaire spécialisé en accompagnement administratif afin d'être recontacté pour vérifier mon dossier.
        </span>
      </label>

      {show_whatsapp_consent && (
        <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-surface-container transition-colors">
          <input
            type="checkbox"
            checked={whatsapp_consent}
            onChange={(e) => onConsentChange(partenaire_consent, e.target.checked)}
            className="mt-1 h-5 w-5 accent-primary shrink-0"
          />
          <span className="text-sm text-on-surface-variant leading-relaxed">
            J'accepte d'être recontacté par WhatsApp au sujet de ma demande de formation et de mon dossier.
          </span>
        </label>
      )}

      <p className="text-[10px] text-on-surface-variant leading-relaxed px-3">
        En soumettant ce formulaire, vous acceptez nos{" "}
        <Link to="/confidentialite" className="underline hover:text-primary">politique de confidentialité</Link> et{" "}
        <Link to="/mentions-legales" className="underline hover:text-primary">mentions légales</Link>. 
        Vos données sont protégées et vous pouvez vous désinscrire à tout moment.
      </p>
    </div>
  )
}
