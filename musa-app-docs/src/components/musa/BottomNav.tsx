import { Link, useRouterState } from "@tanstack/react-router";
import { Heart, Home, Plus, User, Video } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/", label: "Início", icon: Home },
  { to: "/reels", label: "Reels", icon: Video },
  { to: "/favoritos", label: "Favoritos", icon: Heart },
  { to: "/perfil", label: "Perfil", icon: User },
] as const;

export function BottomNav({ onPublish }: { onPublish?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const dark = pathname.startsWith("/reels");

  return (
    <nav
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 safe-bottom border-t backdrop-blur-xl",
        dark
          ? "border-white/10 bg-foreground/85"
          : "border-border-soft bg-card/80",
      )}
      style={{ boxShadow: "0 -18px 46px -28px var(--neon-shadow)" }}
      aria-label="Navegação principal"
    >
      <ul className="mx-auto flex max-w-md items-center justify-between gap-1 px-3 py-1.5">
        {tabs.slice(0, 2).map((t) => (
          <NavItem key={t.to} {...t} dark={dark} active={pathname === t.to} />
        ))}
        <li className="shrink-0">
          <button
            type="button"
            onClick={onPublish}
            aria-label="Publicar"
            className="sheen flex min-h-[44px] min-w-[44px] items-center justify-center rounded-2xl bg-primary px-4 py-2.5 text-primary-foreground shadow-neon-lg transition-transform active:scale-95"
          >
            <Plus className="h-5 w-5" strokeWidth={2.6} />
          </button>
        </li>
        {tabs.slice(2).map((t) => (
          <NavItem key={t.to} {...t} dark={dark} active={pathname === t.to} />
        ))}
      </ul>
    </nav>
  );
}

function NavItem({
  to,
  label,
  icon: Icon,
  active,
  dark,
}: {
  to: string;
  label: string;
  icon: typeof Home;
  active: boolean;
  dark: boolean;
}) {
  return (
    <li className="flex-1">
      <Link
        to={to}
        className={cn(
          "flex min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-semibold tracking-wide transition-colors",
          active
            ? "text-primary"
            : dark
              ? "text-background/60"
              : "text-muted-foreground",
        )}
      >
        <Icon
          className="h-5 w-5"
          strokeWidth={active ? 2.6 : 2}
          fill={active && label === "Favoritos" ? "currentColor" : "none"}
        />
        {label}
      </Link>
    </li>
  );
}
