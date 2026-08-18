import { useState, useEffect } from "react";
import { Download, X, Smartphone } from "lucide-react";

export function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showIosInstructions, setShowIosInstructions] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    const isIos = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
    const isInStandalone = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone;
    if (isIos && !isInStandalone) {
      setShowBanner(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
        setShowBanner(false);
      }
    } else {
      setShowIosInstructions(true);
    }
  };

  if (!showBanner) return null;

  return (
    <aside aria-label="Instalar App MUSA" className="fixed bottom-4 inset-x-4 z-50 mx-auto max-w-md">
      <div className="glass-panel relative flex items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-card/90 p-4 shadow-xl backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-neon">
            <Smartphone className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">App Oficial MUSA</h3>
            <p className="text-xs text-muted-foreground">Instala a app no teu telemóvel para acesso rápido e Reels em ecrã inteiro.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleInstall}
            className="sheen flex min-h-[44px] items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-neon transition-transform active:scale-95"
          >
            <Download className="h-4 w-4" />
            <span>Instalar</span>
          </button>
          <button
            onClick={() => setShowBanner(false)}
            aria-label="Fechar"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {showIosInstructions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-sm rounded-3xl bg-card p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-foreground">Instalar no iPhone (iOS)</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              1. Clica no botão Partilhar (<span className="font-bold">Compartilhar</span>) na barra do Safari.<br />
              2. Desliza para baixo e seleciona <span className="font-bold text-primary">"Adicionar ao Ecrã Principal"</span>.<br />
              3. Confirma em "Adicionar".
            </p>
            <button
              onClick={() => setShowIosInstructions(false)}
              className="mt-5 w-full min-h-[44px] rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-neon"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
