import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import { Toaster } from "sonner";
import appCss from "../styles.css?url";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { siteName, siteUrl } from "@/config/site";
import { trackEvent } from "@/lib/analytics";

function NotFoundComponent() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-surface px-4 py-16">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-primary">404</h1>
        <h2 className="mt-4 headline-md">Page introuvable</h2>
        <p className="mt-2 body-md text-on-surface-variant">
          Cette page n'existe pas ou a été déplacée.
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-3 text-on-primary font-semibold hover:bg-primary-container"
          >
            Retour à l'accueil
          </Link>
          <Link
            to="/passer-test/latest"
            className="inline-flex items-center justify-center rounded-lg border border-outline-variant bg-surface-bright px-5 py-3 font-semibold text-on-surface hover:bg-surface-container"
          >
            Faire l'évaluation
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-surface px-4 py-16">
      <div className="max-w-md text-center">
        <h1 className="headline-md">Cette page n'a pas pu se charger</h1>
        <p className="mt-2 body-md text-on-surface-variant">
          Vous pouvez réessayer ou revenir à l'accueil.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-3 text-on-primary font-semibold hover:bg-primary-container"
          >
            Réessayer
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-lg border border-outline-variant bg-surface-bright px-5 py-3 font-semibold text-on-surface hover:bg-surface-container"
          >
            Accueil
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: `${siteName} — Évaluez votre niveau et trouvez la formation adaptée` },
      {
        name: "description",
        content:
          "Préparation linguistique, carte de séjour, naturalisation et français professionnel. Faites le bilan de votre niveau de français et découvrez le parcours adapté.",
      },
      { property: "og:site_name", content: siteName },
      { property: "og:type", content: "website" },
      { property: "og:url", content: siteUrl },
      { property: "og:title", content: `${siteName} — Bilan de français en ligne` },
      {
        property: "og:description",
        content:
          "Évaluez votre niveau de français et trouvez la formation adaptée à votre projet (CECRL, carte de séjour, naturalisation, travail).",
      },
      { name: "twitter:card", content: "summary" },
      { title: "Lovable App" },
      { property: "og:title", content: "Lovable App" },
      { name: "twitter:title", content: "Lovable App" },
      { name: "description", content: "Site vitrine pour formations en français : prépare au TCF, aide à l'intégration administrative et au français professionnel." },
      { property: "og:description", content: "Site vitrine pour formations en français : prépare au TCF, aide à l'intégration administrative et au français professionnel." },
      { name: "twitter:description", content: "Site vitrine pour formations en français : prépare au TCF, aide à l'intégration administrative et au français professionnel." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/2ac444bc-2f5c-43bf-b9eb-f9e75de9c317/id-preview-e29bf070--5c6d55c7-69d3-40c6-8b1d-5f2988367583.lovable.app-1778909856165.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/2ac444bc-2f5c-43bf-b9eb-f9e75de9c317/id-preview-e29bf070--5c6d55c7-69d3-40c6-8b1d-5f2988367583.lovable.app-1778909856165.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Work+Sans:wght@400;600&display=swap",
      },
      { rel: "canonical", href: siteUrl + (typeof window !== "undefined" ? window.location.pathname : "") },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  useEffect(() => {
    trackEvent("page_view", { path: router.state.location.pathname });
    const unsubscribe = router.subscribe("onResolved", ({ toLocation }) => {
      trackEvent("page_view", { path: toLocation.pathname });
    });
    return unsubscribe;
  }, [router]);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen flex-col bg-surface">
        <Header />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  );
}
