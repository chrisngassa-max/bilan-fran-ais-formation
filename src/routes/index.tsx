import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, FileText, Badge, Flag, Wallet, Building2, Handshake, Briefcase, MessageCircle, Phone, Gavel } from "lucide-react";
import { siteName } from "@/config/site";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `${siteName} — Votre bilan de niveau en 30 minutes` },
      { name: "description", content: "Estimez le niveau de français adapté à votre situation (carte pluriannuelle, carte de résident, naturalisation) et découvrez vos droits à la formation." }
    ],
  }),
  component: IndexPage,
});

function IndexPage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 md:pt-16 pb-12 px-4">
        <div className="max-w-[800px] mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-on-background mb-4 leading-tight">
            Quel niveau de français pour votre carte de séjour, votre résidence ou votre naturalisation ?
          </h1>
          <p className="text-lg text-on-surface-variant mb-8">
            Carte pluriannuelle (A2), carte de résident 10 ans (B1) ou naturalisation (B2) : on évalue votre niveau et on vous oriente vers la formation adaptée.
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Link to="/passer-test/$token" params={{ token: "latest" }}>
              <button className="h-[56px] w-full md:w-auto bg-primary text-on-primary px-8 rounded-lg font-bold flex items-center justify-center gap-2 hover:opacity-95 active:scale-95 transition-all shadow-md">
                Démarrer mon test (30 min, gratuit)
                <ArrowRight className="w-5 h-5" />
              </button>
            </Link>
            <Link to="/niveaux">
              <button className="h-[56px] w-full md:w-auto border-2 border-secondary text-secondary px-8 rounded-lg font-bold flex items-center justify-center hover:bg-secondary-container/20 active:scale-95 transition-all">
                Comprendre les niveaux A2, B1, B2
              </button>
            </Link>
          </div>
        </div>

        {/* Decorative Visual */}
        <div className="mt-12 max-w-[1000px] mx-auto rounded-xl overflow-hidden shadow-sm border border-outline-variant">
          <img
            alt="Groupe étudiant"
            className="w-full h-[300px] md:h-[450px] object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAzYQMSLme1QuqbxfGCtlkQdEwrsTAawK3v1CJ4VpHQNRvuwta1hEDoFjoM-BZPTfFIZNzcmX_aMyA3Own7y38Ms33q4fs7KaMl28oax7RGNn2V11qZu6VdNiyVzHNUHXlO8RFh13pxqAn8aTop1XWq5XcpETWVmHoqRbtzbHSlrt4gNrgi8nb3YiWwMffyu3byArf13QUcVl5WU-UrHnvZpYtVyYiKj9Bl0_EDkHGXkejkyIBfhtFN4e3owE2jSVwHbL9rKsBM39c"
          />
        </div>
      </section>

      {/* Tableau des niveaux (Bento-style Grid) */}
      <section className="py-12 px-4 bg-[#f8efec]">
        <div className="max-w-[800px] mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Le niveau de français demandé pour chaque démarche</h2>
          <div className="grid grid-cols-1 gap-4">
            {/* A2 Card */}
            <div className="bg-surface-bright p-6 rounded-xl border border-outline-variant flex items-center gap-6">
              <div className="bg-primary-container/20 text-primary w-16 h-16 rounded-full flex items-center justify-center shrink-0">
                <span className="text-2xl font-bold">A2</span>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-1">1ère carte pluriannuelle - Niveau A2</h3>
                <p className="text-on-surface-variant">Vous savez vous présenter, comprendre des messages simples et tenir une conversation courte du quotidien.</p>
              </div>
              <FileText className="ml-auto text-outline w-8 h-8 opacity-50 shrink-0 hidden sm:block" />
            </div>

            {/* B1 Card */}
            <div className="bg-surface-bright p-6 rounded-xl border border-outline-variant flex items-center gap-6">
              <div className="bg-secondary-container text-secondary w-16 h-16 rounded-full flex items-center justify-center shrink-0">
                <span className="text-2xl font-bold">B1</span>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-1">Carte de résident 10 ans - Niveau B1</h3>
                <p className="text-on-surface-variant">Vous échangez sur votre travail, vos projets, votre vie en France avec aisance.</p>
              </div>
              <Badge className="ml-auto text-outline w-8 h-8 opacity-50 shrink-0 hidden sm:block" />
            </div>

            {/* B2 Card */}
            <div className="bg-surface-bright p-6 rounded-xl border border-outline-variant flex items-center gap-6">
              <div className="bg-primary text-on-primary w-16 h-16 rounded-full flex items-center justify-center shrink-0">
                <span className="text-2xl font-bold">B2</span>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-1">Naturalisation - Niveau B2</h3>
                <p className="text-on-surface-variant">Vous tenez une conversation soutenue, défendez une opinion, comprenez l'actualité française.</p>
              </div>
              <Flag className="ml-auto text-outline w-8 h-8 opacity-50 shrink-0 hidden sm:block" />
            </div>
          </div>
        </div>
      </section>

      {/* Financements */}
      <section className="py-12 px-4">
        <div className="max-w-[800px] mx-auto text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold">Comment financer votre formation</h2>
          <p className="text-on-surface-variant mt-4">Selon votre situation (CPF, employeur, OPCO, France Travail), la prise en charge peut couvrir une partie ou la totalité de votre formation. Nous étudions votre éligibilité avec vous.</p>
        </div>
        <div className="max-w-[800px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-surface-container p-6 rounded-lg flex flex-col items-center justify-center text-center">
            <Wallet className="text-primary w-10 h-10 mb-2" />
            <span className="font-bold">CPF</span>
          </div>
          <div className="bg-surface-container p-6 rounded-lg flex flex-col items-center justify-center text-center">
            <Building2 className="text-primary w-10 h-10 mb-2" />
            <span className="font-bold">Employeur</span>
          </div>
          <div className="bg-surface-container p-6 rounded-lg flex flex-col items-center justify-center text-center">
            <Handshake className="text-primary w-10 h-10 mb-2" />
            <span className="font-bold">OPCO</span>
          </div>
          <div className="bg-surface-container p-6 rounded-lg flex flex-col items-center justify-center text-center">
            <Briefcase className="text-primary w-10 h-10 mb-2" />
            <span className="font-bold">France Travail</span>
          </div>
        </div>
      </section>

      {/* 3 Étapes */}
      <section className="py-12 px-4 bg-secondary-container/10">
        <div className="max-w-[800px] mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Votre parcours en 3 étapes</h2>
          <div className="flex flex-col gap-6">
            <div className="flex gap-6 items-start">
              <div className="shrink-0 w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold">1</div>
              <div>
                <h4 className="text-xl font-bold">Vous répondez à quelques questions</h4>
                <p className="text-on-surface-variant">Sur votre projet, votre démarche, votre niveau actuel.</p>
              </div>
            </div>
            <div className="h-8 w-px bg-outline-variant ml-5"></div>
            <div className="flex gap-6 items-start">
              <div className="shrink-0 w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold">2</div>
              <div>
                <h4 className="text-xl font-bold">Vous recevez votre bilan</h4>
                <p className="text-on-surface-variant">Niveau estimé, démarches concernées, formation conseillée.</p>
              </div>
            </div>
            <div className="h-8 w-px bg-outline-variant ml-5"></div>
            <div className="flex gap-6 items-start">
              <div className="shrink-0 w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold">3</div>
              <div>
                <h4 className="text-xl font-bold">Nous étudions vos financements</h4>
                <p className="text-on-surface-variant">Un conseiller vous accompagne pour identifier les aides et préparer votre dossier.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bloc Contact */}
      <section className="py-12 px-4">
        <div className="max-w-[1000px] mx-auto bg-surface-container-highest rounded-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2 border border-outline-variant shadow-sm">
          <div className="p-8 bg-primary text-on-primary">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Une question sur votre démarche ?</h2>
            <p className="mb-8 opacity-90">Laissez-nous vos coordonnées pour comprendre votre situation et vous proposer la marche à suivre.</p>
            <div className="flex flex-col gap-4">
              <a className="flex items-center gap-4 bg-white/10 p-4 rounded-lg hover:bg-white/20 transition-all" href="https://wa.me/33000000000">
                <MessageCircle className="w-8 h-8" />
                <div>
                  <div className="text-sm uppercase tracking-wider font-bold opacity-75">WhatsApp</div>
                  <div className="font-bold">Ouvrir la discussion</div>
                </div>
              </a>
              <a className="flex items-center gap-4 bg-white/10 p-4 rounded-lg hover:bg-white/20 transition-all" href="mailto:contact@bilan-francais.fr">
                <MessageCircle className="w-8 h-8" />
                <div>
                  <div className="text-sm uppercase tracking-wider font-bold opacity-75">Email</div>
                  <div className="font-bold">Nous écrire</div>
                </div>
              </a>
            </div>
          </div>
          <div className="p-8">
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div>
                <label className="block font-bold mb-1 text-on-surface">Nom complet</label>
                <input className="w-full h-[56px] px-4 rounded-lg border border-outline bg-surface-bright focus:ring-2 focus:ring-primary focus:border-primary" placeholder="Jean Dupont" type="text" />
                <p className="text-xs text-on-surface-variant mt-1">Pour mieux vous identifier lors de notre appel.</p>
              </div>
              <div>
                <label className="block font-bold mb-1 text-on-surface">Téléphone</label>
                <input className="w-full h-[56px] px-4 rounded-lg border border-outline bg-surface-bright focus:ring-2 focus:ring-primary focus:border-primary" placeholder="06 00 00 00 00" type="tel" />
                <p className="text-xs text-on-surface-variant mt-1">Nous vous contacterons sous 24h.</p>
              </div>
              <button className="w-full h-[56px] bg-primary text-on-primary rounded-lg font-bold hover:opacity-90 transition-all mt-4" type="submit">
                Envoyer ma demande
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Bloc Juridique */}
      <section className="pb-12 px-4">
        <div className="max-w-[800px] mx-auto p-6 bg-error-container/20 border-l-4 border-error rounded-r-lg">
          <div className="flex gap-4">
            <Gavel className="text-error w-8 h-8 shrink-0" />
            <div>
              <h5 className="font-bold text-error mb-1">Information Importante</h5>
              <p className="text-sm text-on-surface-variant">
                {siteName} est un organisme de formation privé. Nous ne sommes pas un service de l'État ou de la Préfecture. Les décisions finales concernant l'obtention de votre titre de séjour ou de votre nationalité dépendent exclusivement des autorités compétentes. Nos formations et bilans visent à vous préparer aux exigences linguistiques officielles.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
