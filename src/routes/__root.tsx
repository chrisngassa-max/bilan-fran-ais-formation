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
import { AuthProvider } from "@/hooks/useAuth";

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
            to="/passer-test/$token" params={{ token: "latest" }}
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
      { title: `${siteName} — Atteignez le niveau A2, B1 ou B2 exigé pour vos démarches` },
      {
        name: "description",
        content:
          "Test de niveau gratuit en 3 minutes. Formations en petits groupes pour atteindre le niveau de français exigé : carte de séjour (A2), carte de résident (B1), naturalisation (B2).",
      },
      { property: "og:site_name", content: siteName },
      { property: "og:type", content: "website" },
      { property: "og:url", content: siteUrl },
      {
        property: "og:title",
        content: `${siteName} — Atteignez le niveau A2, B1 ou B2 exigé pour vos démarches`,
      },
      {
        property: "og:description",
        content:
          "Test de niveau gratuit en 3 minutes. Formations en petits groupes pour atteindre le niveau de français exigé : carte de séjour (A2), carte de résident (B1), naturalisation (B2).",
      },
      // [À COMPLÉTER : og-image.png à produire] — visuel de marque 1200×630 (logo + accroche)
      // à déposer dans public/ puis référencer ici : { property: "og:image", content: `${siteUrl}/og-image.png` }
      { name: "twitter:card", content: "summary_large_image" },
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
      <AuthProvider>
        <div className="flex min-h-screen flex-col bg-surface">
          <Header />
          <main className="flex-1">
            <Outlet />
          </main>
          <Footer />
        </div>
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </QueryClientProvider>
  );
}
