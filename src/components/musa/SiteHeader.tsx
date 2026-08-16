import { Menu, Search, ShoppingBag, Heart, User, Sun, Moon, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, Suspense, lazy } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "@tanstack/react-router";

const NotificationCenter = lazy(() =>
  import("@/components/musa/NotificationCenter").then((m) => ({ default: m.NotificationCenter })),
);

type Props = {
  query: string;
  onQueryChange: (v: string) => void;
  cartCount: number;
  onCartClick: () => void;
  onPublishClick: () => void;
};

export function SiteHeader({ query, onQueryChange, cartCount, onCartClick, onPublishClick }: Props) {
  const [dark, setDark] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  // Get user initials for avatar
  const initials = user?.user_metadata?.['full_name']
    ? user.user_metadata['full_name']
        .split(" ")
        .map((n: string) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : (user?.email?.[0]?.toUpperCase() ?? "?");

  const avatarUrl = user?.user_metadata?.['avatar_url'];

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200/50 bg-white/80 backdrop-blur-md shadow-sm">
      <div className="mx-auto w-full max-w-6xl px-5 py-3 lg:px-8 lg:py-3.5">
        <div className="flex items-center justify-between gap-4">
          {/* Mobile menu */}
          <button
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-gray-200/60 bg-white/80 text-foreground shadow-sm transition-colors hover:bg-white lg:hidden"
            aria-label="Menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <Menu className="size-5" strokeWidth={1.6} />
          </button>

          {/* Logo */}
          <a href="/" className="group flex items-center gap-1.5 lg:order-first">
            <span className="display text-[1.8rem] font-black leading-none text-foreground transition-colors group-hover:text-primary">
              MUSA
            </span>
            <span className="neon-text -translate-y-2 text-[13px]">✦</span>
          </a>

          {/* Desktop search */}
          <div className="glass-panel hidden flex-1 items-center gap-3 rounded-full px-4 py-2.5 lg:flex">
            <Search className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.8} />
            <input
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-soft"
              placeholder="Buscar produtos ou serviços em Angola..."
              aria-label="Buscar"
            />
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1 lg:gap-2">
            {/* Location pill — desktop */}
            <div className="mr-1 hidden items-center gap-1 rounded-full border border-border-soft bg-card/70 px-2.5 py-1.5 shadow-sm lg:flex">
              <MapPin className="size-3 text-primary" />
              <span className="text-[10px] font-medium text-muted-foreground">Angola</span>
            </div>

            <button
              onClick={onPublishClick}
              id="btn-sell-header"
              className="sheen mr-1 hidden min-h-[44px] rounded-full bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-neon transition-all hover:shadow-neon-lg active:scale-95 lg:block"
            >
              + Publicar Grátis
            </button>

            {/* Dark mode toggle */}
            <button
              onClick={() => setDark((v) => !v)}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-transparent text-foreground transition-colors hover:border-border-soft hover:bg-white/90"
              aria-label={dark ? "Modo claro" : "Modo escuro"}
            >
              {dark ? (
                <Sun className="size-4" strokeWidth={1.6} />
              ) : (
                <Moon className="size-4" strokeWidth={1.6} />
              )}
            </button>

            {/* Notifications — only when logged in */}
            {user && (
              <Suspense fallback={<div className="size-9" />}>
                <NotificationCenter />
              </Suspense>
            )}

            {/* Favorites */}
            <button
              onClick={() => (user ? navigate({ to: "/favoritos" }) : signInWithGoogle())}
              className="hidden min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-transparent text-foreground transition-colors hover:border-border-soft hover:bg-white/90 lg:flex"
              aria-label="Favoritos"
            >
              <Heart className="size-5" strokeWidth={1.6} />
            </button>

            {/* Profile */}
            {user ? (
              <button
                onClick={() => navigate({ to: "/perfil" })}
                className="hidden h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-primary/40 shadow-sm transition-all hover:border-primary lg:flex"
                aria-label="Perfil"
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt={initials} className="size-full object-cover" />
                ) : (
                  <span className="flex size-full items-center justify-center bg-gradient-to-br from-primary to-[#FF6DB0] text-[11px] font-bold text-white">
                    {initials}
                  </span>
                )}
              </button>
            ) : (
              <button
                onClick={signInWithGoogle}
                className="hidden min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-transparent text-foreground transition-colors hover:border-border-soft hover:bg-white/90 lg:flex"
                aria-label="Entrar"
              >
                <User className="size-5" strokeWidth={1.6} />
              </button>
            )}

            {/* Cart */}
            <button
              onClick={onCartClick}
              className="relative flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-transparent text-foreground transition-colors hover:border-border-soft hover:bg-white/90"
              aria-label={`Carrinho — ${cartCount} itens`}
            >
              <ShoppingBag className="size-5" strokeWidth={1.6} />
              <span
                className={cn(
                  "absolute top-0.5 right-0.5 flex h-[15px] min-w-[15px] items-center justify-center rounded-full bg-primary font-mono text-[9px] font-bold text-primary-foreground shadow-neon transition-all",
                  cartCount === 0 && "scale-0 opacity-0",
                )}
              >
                {cartCount}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile search */}
        <div className="mt-3 flex items-center gap-2.5 rounded-full border border-gray-200/50 bg-white/80 px-3.5 py-2.5 shadow-sm backdrop-blur-md lg:hidden">
          <Search className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.8} />
          <input
            id="mobile-search-input"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-muted-soft"
            placeholder="Buscar em Angola..."
            aria-label="Buscar"
          />
        </div>

        {/* Mobile menu dropdown */}
        {menuOpen && (
          <div className="glass-panel mt-2 rounded-[24px] p-4 lg:hidden">
            <button
              onClick={() => {
                onPublishClick();
                setMenuOpen(false);
              }}
              className="sheen w-full min-h-[44px] rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-white shadow-neon"
            >
              + Publicar Produto/Serviço — Grátis
            </button>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {user ? (
                <>
                  <button
                    onClick={() => {
                      navigate({ to: "/perfil" });
                      setMenuOpen(false);
                    }}
                    className="flex min-h-[44px] min-w-[44px] flex-col items-center gap-1 rounded-2xl border border-border-soft bg-secondary px-2 py-2.5 text-xs font-semibold text-muted-foreground"
                  >
                    <User className="size-4" />
                    Perfil
                  </button>
                  <button
                    onClick={() => {
                      navigate({ to: "/favoritos" });
                      setMenuOpen(false);
                    }}
                    className="flex min-h-[44px] min-w-[44px] flex-col items-center gap-1 rounded-2xl border border-border-soft bg-secondary px-2 py-2.5 text-xs font-semibold text-muted-foreground"
                  >
                    <Heart className="size-4" />
                    Favoritos
                  </button>
                </>
              ) : (
                ["Produtos", "Serviços", "Lojas"].map((item) => (
                  <button
                    key={item}
                    onClick={() => setMenuOpen(false)}
                    className="min-h-[44px] min-w-[44px] rounded-2xl border border-border-soft bg-secondary px-2 py-2.5 text-xs font-semibold text-muted-foreground"
                  >
                    {item}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
