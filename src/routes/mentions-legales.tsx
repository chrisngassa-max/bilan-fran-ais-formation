import { createFileRoute } from "@tanstack/react-router";
import { siteName } from "@/config/site";

export const Route = createFileRoute("/mentions-legales")({
  head: () => ({
    meta: [
      { title: `Mentions légales — ${siteName}` },
      { property: "og:title", content: `Mentions légales — ${siteName}` },
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
              Le site <strong>{siteName}</strong> est édité par :
            </p>
            <div className="bg-surface-container p-4 rounded-xl space-y-1 font-semibold text-xs border border-outline-variant/30">
              <p>[À COMPLÉTER : Raison sociale], [À COMPLÉTER : forme juridique] au capital de [À COMPLÉTER] €</p>
              <p>SIRET : [À COMPLÉTER] — RCS : [À COMPLÉTER : ville]</p>
              <p>Siège social : [À COMPLÉTER : adresse complète]</p>
              <p>TVA intracommunautaire : [À COMPLÉTER]</p>
              <p>Directeur de la publication : [À COMPLÉTER : nom]</p>
              <p>Contact : contact@bilanfrancaisformation.fr — [À COMPLÉTER : téléphone]</p>
            </div>
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
                <p className="font-bold mb-1">Réseau de diffusion de contenu (CDN) :</p>
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
              Les actions de formation présentées sur ce site sont dispensées en partenariat avec
              [À COMPLÉTER : raison sociale Stafy], organisme de formation certifié <strong>Qualiopi</strong> au titre
              de la catégorie « Actions de formation », déclaration d'activité enregistrée sous le
              numéro [À COMPLÉTER : NDA Stafy] auprès du Préfet de la région [À COMPLÉTER]
              (cet enregistrement ne vaut pas agrément de l'État).
            </p>
            <p className="text-xs">
              Ce partenariat permet, sous réserve du respect des conditions réglementaires
              applicables et de l'accord du financeur, l'éligibilité des formations aux dispositifs
              de financement (CPF, OPCO, France Travail).
            </p>
          </section>

          {/* Section 4: Médiateur de la consommation */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-on-surface border-b pb-2">4. Médiateur de la consommation</h2>
            <p className="text-xs">
              Conformément aux articles L.611-1 et suivants du Code de la consommation, en cas de
              litige non résolu, vous pouvez recourir gratuitement au médiateur de la consommation :
            </p>
            <div className="bg-surface-container p-4 rounded-xl text-xs border border-outline-variant/30">
              <p><strong>[À COMPLÉTER : nom du médiateur auquel l'éditeur a adhéré]</strong></p>
              <p>[À COMPLÉTER : adresse postale] — [À COMPLÉTER : URL de saisine en ligne]</p>
            </div>
          </section>

          {/* Section 5: DPO */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-on-surface border-b pb-2">5. Délégué à la Protection des Données (DPO)</h2>
            <p className="text-xs">
              Pour toute question relative à la protection de vos données personnelles ou pour exercer vos droits (accès, rectification, suppression, opposition, limitation et portabilité) issus du Règlement Général sur la Protection des Données (RGPD), vous pouvez contacter notre Délégué à la protection des données :
            </p>
            <div className="bg-surface-container p-4 rounded-xl text-xs border border-outline-variant/30">
              <p><strong>Délégué à la protection des données : [À COMPLÉTER : nom ou « le représentant légal »]</strong></p>
              <p>Email : dpo@bilanfrancaisformation.fr</p>
              <p>Adresse : [À COMPLÉTER : adresse postale du DPO / siège social]</p>
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
