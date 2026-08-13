import {
  Menu,
  Search,
  ShoppingBag,
  Heart,
  User,
  Sun,
  Moon,
  MapPin,
  LayoutDashboard,
} from "lucide-react";
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
  onSellClick: () => void;
};

export function SiteHeader({ query, onQueryChange, cartCount, onCartClick, onSellClick }: Props) {
  const [dark, setDark] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  // Get user initials for avatar
  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name
        .split(" ")
        .map((n: string) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : (user?.email?.[0]?.toUpperCase() ?? "?");

  const avatarUrl = user?.user_metadata?.avatar_url;

  return (
    <header className="sticky top-0 z-40 border-b border-border-soft/70 bg-background/70 backdrop-blur-2xl">
      <div className="mx-auto w-full max-w-6xl px-5 py-3 lg:px-8 lg:py-3.5">
        <div className="flex items-center justify-between gap-4">
          {/* Mobile menu */}
          <button
            className="flex size-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-secondary lg:hidden"
            aria-label="Menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <Menu className="size-5" strokeWidth={1.6} />
          </button>

          {/* Logo */}
          <a href="/" className="flex items-center gap-1.5 lg:order-first">
            <span className="display text-[1.7rem] font-black leading-none tracking-[0.03em] text-foreground">
              MUSA
            </span>
            <span className="neon-text -translate-y-2 text-[13px]">✦</span>
          </a>

          {/* Desktop search */}
          <div className="hidden flex-1 items-center gap-3 rounded-full border border-border-soft bg-card/80 px-4 py-2.5 shadow-sm lg:flex">
            <Search className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.8} />
            <input
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-soft"
              placeholder="Buscar produtos ou serviços em Luanda..."
              aria-label="Buscar"
            />
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1 lg:gap-2">
            {/* Location pill — desktop */}
            <div className="mr-1 hidden items-center gap-1 rounded-full border border-border-soft px-2.5 py-1.5 lg:flex">
              <MapPin className="size-3 text-primary" />
              <span className="text-[10px] font-medium text-muted-foreground">Luanda</span>
            </div>

            <button
              onClick={onSellClick}
              id="btn-sell-header"
              className="mr-1 hidden rounded-full bg-gradient-to-r from-primary to-[#FF6DB0] px-4 py-2.5 text-xs font-bold text-white shadow-neon transition-all hover:opacity-90 active:scale-95 lg:block"
            >
              + Publicar Grátis
            </button>

            {/* Dark mode toggle */}
            <button
              onClick={() => setDark((v) => !v)}
              className="flex size-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-secondary"
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
              className="hidden size-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-secondary lg:flex"
              aria-label="Favoritos"
            >
              <Heart className="size-5" strokeWidth={1.6} />
            </button>

            {/* Dashboard / Profile */}
            {user ? (
              <button
                onClick={() => navigate({ to: "/dashboard" })}
                className="hidden size-9 items-center justify-center overflow-hidden rounded-full border-2 border-primary/40 transition-all hover:border-primary lg:flex"
                aria-label="Dashboard"
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
                className="hidden size-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-secondary lg:flex"
                aria-label="Entrar"
              >
                <User className="size-5" strokeWidth={1.6} />
              </button>
            )}

            {/* Cart */}
            <button
              onClick={onCartClick}
              className="relative flex size-9 items-center justify-center text-foreground"
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
        <div className="mt-3 flex items-center gap-2.5 rounded-full border border-border-soft bg-card/85 px-3.5 py-2.5 shadow-sm lg:hidden">
          <Search className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.8} />
          <input
            id="mobile-search-input"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-muted-soft"
            placeholder="Buscar em Luanda..."
            aria-label="Buscar"
          />
        </div>

        {/* Mobile menu dropdown */}
        {menuOpen && (
          <div className="mt-2 rounded-[24px] border border-border-soft bg-card p-4 shadow-soft lg:hidden">
            <button
              onClick={() => {
                onSellClick();
                setMenuOpen(false);
              }}
              className="w-full rounded-2xl bg-gradient-to-r from-primary to-[#FF6DB0] px-4 py-3 text-sm font-bold text-white shadow-neon"
            >
              + Publicar Produto/Serviço — Grátis
            </button>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {user ? (
                <>
                  <button
                    onClick={() => {
                      navigate({ to: "/dashboard" });
                      setMenuOpen(false);
                    }}
                    className="flex flex-col items-center gap-1 rounded-2xl border border-border-soft bg-secondary px-2 py-2.5 text-xs font-semibold text-muted-foreground"
                  >
                    <LayoutDashboard className="size-4" />
                    Dashboard
                  </button>
                  <button
                    onClick={() => {
                      navigate({ to: "/favoritos" });
                      setMenuOpen(false);
                    }}
                    className="flex flex-col items-center gap-1 rounded-2xl border border-border-soft bg-secondary px-2 py-2.5 text-xs font-semibold text-muted-foreground"
                  >
                    <Heart className="size-4" />
                    Favoritos
                  </button>
                  <button
                    onClick={() => {
                      navigate({ to: "/perfil" });
                      setMenuOpen(false);
                    }}
                    className="flex flex-col items-center gap-1 rounded-2xl border border-border-soft bg-secondary px-2 py-2.5 text-xs font-semibold text-muted-foreground"
                  >
                    <User className="size-4" />
                    Perfil
                  </button>
                </>
              ) : (
                ["Produtos", "Serviços", "Lojas"].map((item) => (
                  <button
                    key={item}
                    onClick={() => setMenuOpen(false)}
                    className="rounded-2xl border border-border-soft bg-secondary px-2 py-2.5 text-xs font-semibold text-muted-foreground"
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
