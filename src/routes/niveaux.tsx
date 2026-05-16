import { createFileRoute, Link } from "@tanstack/react-router";
import { siteName } from "@/config/site";
import { Home, Sparkles, GraduationCap } from "lucide-react";

export const Route = createFileRoute("/niveaux")({
  head: () => ({
    meta: [{ title: `${siteName} - Les niveaux A2, B1 et B2 expliqués` }],
  }),
  component: NiveauxPage,
});

function NiveauxPage() {
  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <main className="flex-1">
        <section className="pt-12 md:pt-16 pb-12 px-4 bg-surface-container-low text-center border-b border-outline-variant">
          <div className="max-w-[800px] mx-auto">
            <span className="text-xs font-bold font-label text-primary uppercase tracking-widest block mb-2">
              RÉFÉRENTIEL CECRL
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-on-surface mb-4">
              Comprendre les niveaux de français
            </h1>
            <p className="text-lg text-on-surface-variant max-w-[700px] mx-auto">
              Carte de séjour pluriannuelle / résident (A2/B1 selon situation), naturalisation (B1 oral et écrit selon Service-Public F34708) :
              chaque démarche correspond à un niveau indicatif.
            </p>
          </div>
        </section>

        <div className="max-w-[1000px] mx-auto px-4 py-12 space-y-12">
          <section>
            <h2 className="text-2xl font-bold text-on-surface mb-6">Synthèse des obligations</h2>
            <div className="overflow-x-auto bg-surface-bright border border-outline-variant rounded-xl shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead className="bg-surface-container-lowest border-b border-outline-variant">
                  <tr>
                    <th className="p-4 text-xs font-bold font-label text-outline uppercase tracking-wider">Niveau</th>
                    <th className="p-4 text-xs font-bold font-label text-outline uppercase tracking-wider">Objectif</th>
                    <th className="p-4 text-xs font-bold font-label text-outline uppercase tracking-wider">Exigence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-variant">
                  <tr>
                    <td className="p-4 font-bold text-primary">A2</td>
                    <td className="p-4">1re carte de séjour pluriannuelle</td>
                    <td className="p-4">
                      <span className="bg-secondary-container text-on-secondary-container px-2 py-1 rounded text-sm font-medium">
                        Obligatoire
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-primary">B1</td>
                    <td className="p-4">Carte de résident / Naturalisation par décret</td>
                    <td className="p-4">
                      <span className="bg-secondary-container text-on-secondary-container px-2 py-1 rounded text-sm font-medium">
                        Requis (B1 oral/écrit)
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-primary">B2</td>
                    <td className="p-4">Niveau avancé (confort & intégration)</td>
                    <td className="p-4">
                      <span className="bg-surface-container-high text-on-surface-variant px-2 py-1 rounded text-sm font-medium">
                        Optionnel
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-6">
            <div className="bg-surface-bright p-8 rounded-xl border border-outline-variant flex flex-col md:flex-row gap-6 items-start relative overflow-hidden shadow-sm">
              <div className="absolute top-4 right-4 text-primary opacity-10">
                <Home className="w-24 h-24" />
              </div>
              <div className="flex-1 relative z-10">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-4xl font-bold text-primary">A2</span>
                  <span className="text-xs font-bold font-label text-secondary bg-secondary-container px-3 py-1 rounded-full uppercase tracking-wider">
                    Élémentaire
                  </span>
                </div>
                <h3 className="text-2xl font-bold mb-3">La carte de séjour pluriannuelle</h3>
                <p className="text-on-surface-variant mb-6 leading-relaxed">
                  Depuis le 1er janvier 2026, le niveau A2 est demandé pour obtenir une première carte de séjour
                  pluriannuelle. Cela signifie pouvoir comprendre, répondre et gérer les échanges simples du
                  quotidien en France.
                </p>
                <div className="bg-surface-container p-4 rounded-lg border border-surface-variant italic text-sm text-on-surface-variant">
                  "Le niveau qui aide à sécuriser votre installation et vos premières démarches durables en France."
                </div>
              </div>
            </div>

            <div className="bg-surface-bright p-8 rounded-xl border-2 border-primary flex flex-col md:flex-row gap-6 items-start relative overflow-hidden shadow-md">
              <div className="absolute top-4 right-4 text-primary-container opacity-10">
                <Sparkles className="w-24 h-24" />
              </div>
              <div className="flex-1 relative z-10">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-4xl font-bold text-primary">B1</span>
                  <span className="text-xs font-bold font-label text-on-primary-container bg-primary-container px-3 py-1 rounded-full uppercase tracking-wider">
                    Intermédiaire
                  </span>
                </div>
                <h3 className="text-2xl font-bold mb-3">La carte de résident / Naturalisation</h3>
                <p className="text-on-surface-variant mb-6 leading-relaxed">
                  Le niveau B1 marque une autonomie réelle. Il est désormais exigé pour la naturalisation par décret (oral et écrit)
                  ainsi que pour la plupart des cartes de résident de 10 ans. Vous devez pouvoir échanger sur votre travail, vos
                  projets et comprendre les points essentiels d'une conversation standard.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-sm text-on-surface">
                    <span className="text-secondary shrink-0">✓</span>
                    Le niveau attendu pour viser une stabilité plus durable
                  </li>
                  <li className="flex items-center gap-3 text-sm text-on-surface">
                    <span className="text-secondary shrink-0">✓</span>
                    Une base solide pour évoluer dans votre vie personnelle et professionnelle
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-surface-bright p-8 rounded-xl border border-outline-variant flex flex-col md:flex-row gap-6 items-start relative overflow-hidden shadow-sm">
              <div className="absolute top-4 right-4 text-on-surface-variant opacity-10">
                <GraduationCap className="w-24 h-24" />
              </div>
              <div className="flex-1 relative z-10">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-4xl font-bold text-on-surface">B2</span>
                  <span className="text-xs font-bold font-label text-on-surface bg-surface-container-high px-3 py-1 rounded-full uppercase tracking-wider">
                    Avancé
                  </span>
                </div>
                <h3 className="text-2xl font-bold mb-3">Niveau Avancé (B2)</h3>
                <p className="text-on-surface-variant leading-relaxed">
                  Le niveau B2 permet de défendre une opinion et nuancer vos idées avec précision. 
                  <strong> Important :</strong> Bien que le niveau B1 soit suffisant pour la naturalisation, 
                  le B2 est recommandé pour ceux qui visent une intégration professionnelle et sociale totale, 
                  car il permet de suivre des échanges complexes sans effort.
                </p>
              </div>
            </div>
          </section>

          <section className="mt-12 p-10 bg-secondary-container rounded-2xl text-center shadow-inner">
            <h2 className="text-2xl font-bold text-on-secondary-container mb-3">Vous n'êtes pas sûr(e) de votre niveau ?</h2>
            <p className="text-on-secondary-container/80 mb-8 max-w-[500px] mx-auto">
              Répondez à quelques questions pour estimer rapidement votre niveau (2 min). Pour un bilan complet,
              un test approfondi est disponible.
            </p>
            <Link to="/passer-test/$token" params={{ token: "latest" }}>
              <button className="bg-primary text-on-primary min-h-[56px] px-10 rounded-lg font-bold hover:opacity-90 active:scale-95 transition-all shadow-md">
                Démarrer (2 min, gratuit)
              </button>
            </Link>
            <p className="mt-4 text-sm text-on-secondary-container/60">
              Service gratuit, sans engagement et conforme RGPD.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
