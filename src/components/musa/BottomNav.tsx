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

  const handleNavClick = (item: typeof navItems[0]) => {
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
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border-soft bg-background/95 backdrop-blur-xl lg:hidden">
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
                "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all",
                isPublish && "scale-110",
              )}
              aria-label={item.label}
            >
              {isPublish ? (
                <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-purple-600 shadow-neon">
                  <Icon className="size-5 text-white" strokeWidth={2} />
                </span>
              ) : (
                <>
                  <Icon
                    className={cn(
                      "size-5 transition-colors",
                      isActive ? "text-primary" : "text-muted-foreground",
                    )}
                    strokeWidth={isActive ? 2.2 : 1.6}
                  />
                  <span
                    className={cn(
                      "text-[9px] font-medium transition-colors",
                      isActive ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    {item.label}
                  </span>
                </>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
