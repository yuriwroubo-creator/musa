import { createFileRoute } from "@tanstack/react-router";
import {
  ChevronRight,
  Heart,
  LogIn,
  Package,
  Settings,
  Store,
} from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";

export const Route = createFileRoute("/perfil")({
  head: () => ({
    meta: [
      { title: "Perfil — MUSA" },
      {
        name: "description",
        content:
          "Gere a tua conta MUSA: loja, encomendas, favoritos e preferências.",
      },
      { property: "og:title", content: "Perfil — MUSA" },
      {
        property: "og:description",
        content: "Conta MUSA: loja, encomendas e favoritos.",
      },
    ],
  }),
  component: Perfil,
});

function Perfil() {
  const { ids } = useFavorites();

  return (
    <main className="px-4 pt-[max(1rem,env(safe-area-inset-top))]">
      <h1 className="display text-3xl">Perfil</h1>

      <section className="ink-panel mt-4 p-5">
        <p className="text-xs uppercase tracking-[0.2em] opacity-70">
          Convidada
        </p>
        <h2 className="mt-1 text-lg font-bold">Entra na MUSA</h2>
        <p className="mt-1 text-sm opacity-75">
          Guarda favoritos, segue criadoras e acompanha encomendas em qualquer
          dispositivo.
        </p>
        <button
          type="button"
          className="mt-4 flex min-h-[44px] items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground shadow-neon"
        >
          <LogIn className="h-4 w-4" />
          Entrar ou criar conta
        </button>
      </section>

      <div className="mt-4 grid grid-cols-3 gap-3">
        {[
          { label: "Favoritos", value: ids.length },
          { label: "Encomendas", value: 0 },
          { label: "A seguir", value: 0 },
        ].map((s) => (
          <div key={s.label} className="luxe-card p-3 text-center">
            <p className="font-mono text-lg font-bold text-primary">{s.value}</p>
            <p className="text-[11px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <ul className="mt-4 space-y-2 pb-6">
        {[
          { icon: Store, label: "Abrir a minha loja" },
          { icon: Package, label: "As minhas encomendas" },
          { icon: Heart, label: "Criadoras que sigo" },
          { icon: Settings, label: "Definições" },
        ].map(({ icon: Icon, label }) => (
          <li key={label}>
            <button
              type="button"
              className="luxe-card flex w-full min-h-[44px] items-center gap-3 p-3 text-left transition-transform active:scale-[0.99]"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-foreground">
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                {label}
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
