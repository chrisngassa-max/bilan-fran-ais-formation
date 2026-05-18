import { createFileRoute } from "@tanstack/react-router";
import { siteName } from "@/config/site";

export const Route = createFileRoute("/mentions-legales")({
  head: () => ({
    meta: [
      { title: `${siteName} — Mentions Légales` },
      { name: "robots", content: "index,follow" },
    ],
  }),
  component: MentionsLegalesPage,
});

function MentionsLegalesPage() {
  return (
    <div className="min-h-screen bg-[#fcfaf7] py-12 px-4">
      <div className="max-w-[850px] mx-auto bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-outline-variant">
        <h1 className="text-3xl font-black mb-8 text-on-surface">Mentions Légales</h1>
        
        <div className="space-y-8 text-on-surface-variant leading-relaxed text-sm">
          {/* Section 1: Éditeur */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-on-surface border-b pb-2">1. Éditeur du site</h2>
            <p>
              Le site <strong>{siteName}</strong> est édité par la société :
            </p>
            <div className="bg-surface-container p-4 rounded-xl space-y-1 font-semibold text-xs border border-outline-variant/30">
              <p>« TODO-LEGAL-EDITEUR-NOM » : [Nom de la Société / Raison sociale]</p>
              <p>« TODO-LEGAL-EDITEUR-FORME » : [Forme juridique, e.g., SAS / SARL] au capital de [Montant] €</p>
              <p>« TODO-LEGAL-EDITEUR-SIRET » : SIRET : [Numéro SIRET] - RCS : [Ville d'immatriculation]</p>
              <p>« TODO-LEGAL-EDITEUR-ADRESSE » : Siège social : [Adresse complète]</p>
              <p>« TODO-LEGAL-EDITEUR-TVA » : TVA Intracommunautaire : [Numéro TVA]</p>
              <p>« TODO-LEGAL-EDITEUR-DIRECTEUR » : Directeur de la publication : [Nom du Directeur]</p>
            </div>
            <p className="text-xs">
              « TODO-LEGAL-DREETS » : Déclaration d'activité de prestataire de formation enregistrée sous le numéro <strong>[Numéro de Déclaration d'Activité (NDA)]</strong> auprès du Préfet de région <strong>[Région]</strong> (cet enregistrement ne vaut pas agrément de l'État).
            </p>
          </section>

          {/* Section 2: Hébergement & CDN */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-on-surface border-b pb-2">2. Hébergement & CDN</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-surface-container p-4 rounded-xl border border-outline-variant/30 text-xs">
                <p className="font-bold mb-1">Hébergeur du site :</p>
                <p>Vercel Inc.</p>
                <p>340 S Lemon Ave #4133</p>
                <p>Walnut, CA 91789, États-Unis</p>
                <p>Contact : https://vercel.com</p>
              </div>
              <div className="bg-surface-container p-4 rounded-xl border border-outline-variant/30 text-xs">
                <p className="font-bold mb-1">« TODO-LEGAL-CDN » : Réseau de diffusion de contenu (CDN) :</p>
                <p>Cloudflare, Inc.</p>
                <p>101 Townsend St</p>
                <p>San Francisco, CA 94107, États-Unis</p>
                <p>Contact : https://www.cloudflare.com</p>
              </div>
            </div>
          </section>

          {/* Section 3: Certification Qualiopi */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-on-surface border-b pb-2">3. Certification Qualiopi</h2>
            <p className="text-xs">
              « TODO-LEGAL-QUALIOP » : Nos parcours de formation linguistique sont dispensés en partenariat avec des organismes de formation certifiés <strong>Qualiopi</strong> au titre de la catégorie d'actions suivantes : <strong>Actions de formation</strong>. 
            </p>
            <p className="text-xs">
              Cette collaboration garantit l'éligibilité de nos formations aux financements publics (CPF, OPCO, France Travail) sous réserve du respect des conditions réglementaires applicables.
            </p>
          </section>

          {/* Section 4: Médiateur de la consommation */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-on-surface border-b pb-2">4. Médiateur de la consommation</h2>
            <p className="text-xs">
              « TODO-LEGAL-MEDIATEUR » : Conformément aux dispositions des articles L. 611-1 et suivants du Code de la consommation, en cas de litige de consommation non résolu par notre service client, vous pouvez recourir gratuitement au médiateur de la consommation agréé suivant :
            </p>
            <div className="bg-surface-container p-4 rounded-xl text-xs border border-outline-variant/30">
              <p><strong>[Nom du Médiateur de la consommation]</strong></p>
              <p>Adresse : [Adresse postale du Médiateur]</p>
              <p>Site internet : [URL du Médiateur pour dépôt de dossier en ligne]</p>
            </div>
          </section>

          {/* Section 5: DPO */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-on-surface border-b pb-2">5. Délégué à la Protection des Données (DPO)</h2>
            <p className="text-xs">
              « TODO-LEGAL-DPO » : Pour toute question relative à la protection de vos données personnelles ou pour exercer vos droits (accès, rectification, suppression, opposition, limitation et portabilité) issus du Règlement Général sur la Protection des Données (RGPD), vous pouvez contacter notre Délégué à la Protection des Données :
            </p>
            <div className="bg-surface-container p-4 rounded-xl text-xs border border-outline-variant/30">
              <p><strong>DPO {siteName}</strong></p>
              <p>Email : [Email dédié DPO, e.g., dpo@bilanfrancais.fr]</p>
              <p>Adresse : [Adresse postale du DPO / Siège social]</p>
            </div>
          </section>

          {/* Section 6: Propriété intellectuelle */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-on-surface border-b pb-2">6. Propriété intellectuelle</h2>
            <p className="text-xs">
              L'ensemble de ce site (structure, textes, logos, animations, algorithmes) relève de la législation française et internationale sur le droit d'auteur et la propriété intellectuelle. Tous les droits de reproduction sont réservés. Toute utilisation non autorisée du site ou de son contenu constituerait une contrefaçon sanctionnée par les articles L. 335-2 et suivants du Code de la propriété intellectuelle.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
