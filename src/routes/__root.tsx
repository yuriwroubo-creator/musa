import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "../components/ui/sonner";
import { SellProvider, useSellModal } from "@/lib/SellContext";
import { AudioProvider } from "@/lib/AudioContext";
import { BottomNav } from "@/components/musa/BottomNav";
import { PublishActionSheet } from "@/components/musa/PublishActionSheet";
import { SellModal } from "@/components/musa/SellModal";
import { GlobalAudioPlayer } from "@/components/musa/GlobalAudioPlayer";
import { OnboardingGate } from "@/components/musa/OnboardingGate";
import { MusaAiFab } from "@/components/musa/MusaAiFab";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A página que procuras não existe ou foi movida.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Ir para início
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Esta página não carregou
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Algo falhou ao carregar. Podes tentar novamente ou voltar ao início.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Tentar novamente
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Ir para início
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
      { name: "theme-color", content: "#FF2D78" },
      { title: "MUSA — Mercado de Beleza & Moda" },
         { name: "description", content: "Marketplace de beleza e moda em Angola: produtos e serviços de vendedoras verificadas." },
      { property: "og:title", content: "MUSA — Mercado de Beleza & Moda" },
      {
        property: "og:description",
        content:
             "Marketplace de beleza e moda em Angola: produtos e serviços de vendedoras verificadas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;1,500;1,600&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap",
      },
      { rel: "icon", href: "/musa-mark.svg", type: "image/svg+xml" },
    ],
  }),

  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt">
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

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(console.error);
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AudioProvider>
        <SellProvider>
          {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
          <Outlet />

          {/* Global Modals and Navigation */}
          <GlobalComponents />
          <OnboardingGate />
          {/* Hide global MusaAiFab on Reels page to avoid floating button there */}
          {typeof window !== "undefined" && !window.location.pathname.startsWith("/reels") && (
            <MusaAiFab />
          )}

          <Toaster position="top-center" />
        </SellProvider>
      </AudioProvider>
    </QueryClientProvider>
  );
}

function GlobalComponents() {
  const {
    sellOpen,
    setSellOpen,
    publishSheetOpen,
    setPublishSheetOpen,
    openPublish,
    publishMode,
  } = useSellModal();
  return (
    <>
      <BottomNav
        onSellClick={() => setPublishSheetOpen(true)}
        onSearchClick={() => {
          window.scrollTo({ top: 0, behavior: "smooth" });
          setTimeout(() => document.getElementById("mobile-search-input")?.focus(), 100);
        }}
      />
      <PublishActionSheet
        open={publishSheetOpen}
        onClose={() => setPublishSheetOpen(false)}
        onPublishSite={() => openPublish("site")}
        onPublishReel={() => openPublish("reel")}
      />
      <SellModal
        open={sellOpen}
        onClose={() => setSellOpen(false)}
        isReel={publishMode === "reel"}
      />
      <GlobalAudioPlayer />
    </>
  );
}
