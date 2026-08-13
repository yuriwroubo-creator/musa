import { Home, Search, PlusSquare, Heart, User } from "lucide-react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  onSellClick: () => void;
  onSearchClick?: () => void;
}

const navItems = [
  { icon: Home, label: "Início", path: "/" },
  { icon: Search, label: "Categorias", path: null, action: "search" },
  { icon: PlusSquare, label: "Publicar", path: null, action: "sell" },
  { icon: Heart, label: "Favoritos", path: "/favoritos", requiresAuth: true },
  { icon: User, label: "Perfil", path: "/perfil", requiresAuth: true },
];

export function BottomNav({ onSellClick, onSearchClick }: BottomNavProps) {
  const navigate = useNavigate();
  const { user, signInWithGoogle } = useAuth();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const handleNavClick = (item: (typeof navItems)[0]) => {
    if (item.action === "sell") {
      onSellClick();
      return;
    }
    if (item.action === "search") {
      onSearchClick?.();
      return;
    }
    if (item.requiresAuth && !user) {
      signInWithGoogle();
      return;
    }
    if (item.path) {
      navigate({ to: item.path });
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border-soft bg-background/80 shadow-[0_-12px_40px_-24px_rgba(255,45,120,0.4)] backdrop-blur-2xl lg:hidden">
      <div className="flex items-center justify-around px-2 py-2 pb-safe">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.path ? currentPath === item.path : false;
          const isPublish = item.action === "sell";

          return (
            <button
              key={item.label}
              onClick={() => handleNavClick(item)}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 transition-all duration-300",
                isPublish && "scale-110",
              )}
              aria-label={item.label}
            >
              {isPublish ? (
                <span className="flex h-11 w-[3.25rem] items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-[#FF6DB0] shadow-neon transition-transform duration-300 active:scale-95">
                  <Icon className="size-5 text-white" strokeWidth={2.2} />
                </span>
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <span
                    className={cn(
                      "flex size-9 items-center justify-center rounded-full transition-all duration-300",
                      isActive
                        ? "scale-105 bg-primary text-white shadow-neon"
                        : "text-muted-foreground",
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-[22px] transition-transform duration-300",
                        isActive && "animate-[pulse_1.6s_ease-in-out_infinite]",
                      )}
                      strokeWidth={isActive ? 2.5 : 1.8}
                    />
                  </span>
                  <span
                    className={cn(
                      "text-[9px] font-semibold tracking-tight transition-colors",
                      isActive ? "text-primary" : "text-muted-foreground/70",
                    )}
                  >
                    {item.label}
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
