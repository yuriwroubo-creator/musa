import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { globalSearch } from "@/lib/algolia";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFollows } from "@/hooks/useFollows";
import { SiteHeader } from "@/components/musa/SiteHeader";
import { BottomNav } from "@/components/musa/BottomNav";
import { ProductCard, ServiceCard, VendorCard } from "@/components/musa/Cards";
import { ItemDrawer, type DrawerItem } from "@/components/musa/ItemDrawer";
import { SellModal } from "@/components/musa/SellModal";
import {
  products,
  services,
  vendors,
  productCategories,
  serviceCategories,
} from "@/lib/musa-data";
import { cn } from "@/lib/utils";
import { ShoppingBag } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MUSA — Mercado de Beleza & Moda em Luanda" },
      {
        name: "description",
        content:
          "MUSA reúne moda, cabelos, maquilhagem e serviços de beleza de vendedoras verificadas em Luanda. Compre produtos e agende profissionais.",
      },
      { property: "og:title", content: "MUSA — Mercado de Beleza & Moda em Luanda" },
      {
        property: "og:description",
        content:
          "Produtos e serviços de beleza de empreendedoras verificadas em Luanda. Compre, agende e venda na MUSA.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type Tab = "produtos" | "servicos" | "lojas" | "seguidoras";

const tabs: { id: Tab; label: string; emoji: string }[] = [
  { id: "produtos", label: "Produtos", emoji: "🛍️" },
  { id: "servicos", label: "Serviços", emoji: "✨" },
  { id: "lojas", label: "Lojas & Marcas", emoji: "🏪" },
  { id: "seguidoras", label: "A Seguir", emoji: "💖" },
];

function Index() {
  const [tab, setTab] = useState<Tab>("produtos");
  const [prodCat, setProdCat] = useState("Todos");
  const [svcCat, setSvcCat] = useState("Todos");
  const [query, setQuery] = useState("");
  const [drawerItem, setDrawerItem] = useState<DrawerItem | null>(null);
  const [sellOpen, setSellOpen] = useState(false);
  const [cart, setCart] = useState(0);

  const q = query.trim().toLowerCase();
  const isDev = import.meta.env.DEV;

  // Supabase Queries
  const { data: dbProducts, isLoading: loadingProducts, error: errorProducts } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: dbServices, isLoading: loadingServices, error: errorServices } = useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const { data, error } = await supabase.from("services").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: dbVendors, isLoading: loadingVendors, error: errorVendors } = useQuery({
    queryKey: ["vendor_subscriptions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("vendor_subscriptions").select("*").eq("status", "active");
      if (error) throw error;
      return data;
    },
  });

  // Base Data (Fallback to local mock ONLY in dev if DB is empty)
  const baseProducts = isDev && (!dbProducts || dbProducts.length === 0) ? products : (dbProducts ?? []);
  const baseServices = isDev && (!dbServices || dbServices.length === 0) ? services : (dbServices ?? []);
  const baseVendors = isDev && (!dbVendors || dbVendors.length === 0) ? vendors : (dbVendors ?? []);

  const { follows, isLoading: loadingFollows } = useFollows();
  const { user, signInWithGoogle } = useAuth();

  const followedVendors = useMemo(() => {
    if (!follows) return [];
    const followedIds = follows.map((f) => f.following_id);
    return baseVendors.filter((v: any) => followedIds.includes(v.id || v.serial_id));
  }, [baseVendors, follows]);

  const { data: searchResults } = useQuery({
    queryKey: ["search", q],
    queryFn: () => globalSearch(q),
    enabled: q.length > 0,
  });

  const visibleProducts = useMemo(() => {
    if (q !== "") {
      return (searchResults?.products ?? []).map((hit) => ({
        id: hit.objectID,
        store: hit.description || "Vendedora",
        name: hit.name || "Produto MUSA",
        price: hit.price ? `${hit.price.toLocaleString("pt-AO")} AOA` : "Preço sob consulta",
        rating: "5.0",
        category: hit.category || "Geral",
        img: hit.image_url || "https://placehold.co/400x500/f3f4f6/1f2937?text=MUSA",
      }));
    }
    return baseProducts.filter(
      (p: any) => prodCat === "Todos" || prodCat === "Promoções" || p.category === prodCat
    );
  }, [q, searchResults, prodCat, baseProducts]);

  const visibleServices = useMemo(() => {
    if (q !== "") {
      return (searchResults?.services ?? []).map((hit) => ({
        id: hit.objectID,
        name: hit.name || "Profissional",
        title: hit.description || "Serviço",
        price: hit.price ? `${hit.price.toLocaleString("pt-AO")} AOA` : "Preço sob consulta",
        home: false,
        rating: "5.0",
        category: hit.category || "Geral",
        img: hit.image_url || "https://placehold.co/400x400/f3f4f6/1f2937?text=MUSA",
      }));
    }
    return baseServices.filter(
      (s: any) => svcCat === "Todos" || s.category === svcCat
    );
  }, [q, searchResults, svcCat, baseServices]);

  const confirm = (item: DrawerItem) => {
    setDrawerItem(null);
    if (item.kind === "product") {
      setCart((c) => c + 1);
      toast.success("Adicionado ao carrinho", { description: item.title });
    } else {
      toast.success("Agendamento confirmado! ✅", { description: item.title });
    }
  };

  return (
    <div className="min-h-screen pb-28 lg:pb-0">
      <SiteHeader
        query={query}
        onQueryChange={setQuery}
        cartCount={cart}
        onCartClick={() => toast(`Carrinho`, { description: `${cart} ${cart === 1 ? "item" : "itens"}` })}
        onSellClick={() => setSellOpen(true)}
      />

      <main className="mx-auto w-full max-w-6xl px-5 lg:px-8">

        {/* Tabs */}
        <div
          role="tablist"
          className="mt-4 flex gap-1.5 rounded-2xl border border-border-soft bg-card p-1 lg:mx-auto lg:mt-8 lg:max-w-xl"
        >
          {tabs.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-xl px-1 py-2.5 text-[12px] font-semibold transition-all duration-300",
                tab === t.id
                  ? "bg-primary text-primary-foreground shadow-neon"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span className="hidden sm:inline">{t.emoji}</span>
              {t.label}
            </button>
          ))}
        </div>

        {tab === "produtos" && (
          <section>
            <Pills options={productCategories} value={prodCat} onChange={setProdCat} />
            <SectionTitle
              title="Selecionado para si"
              sub=""
            />
            {errorProducts ? (
              <ErrorState message="Não foi possível carregar os produtos. Tenta novamente." />
            ) : loadingProducts ? (
              <LoadingGrid />
            ) : visibleProducts.length === 0 ? (
              <Empty message="Ainda não há produtos disponíveis nesta categoria." />
            ) : (
              <div className="grid grid-cols-2 gap-3.5 pt-3.5 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5">
                {visibleProducts.map((p: any) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onBuy={() =>
                      setDrawerItem({
                        kind: "product",
                        img: p.img || p.image_url,
                        title: p.name,
                        price: p.price,
                      })
                    }
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {tab === "servicos" && (
          <section>
            <Pills options={serviceCategories} value={svcCat} onChange={setSvcCat} />
            <SectionTitle
              title="Profissionais perto de si"
              sub=""
            />
            {errorServices ? (
              <ErrorState message="Não foi possível carregar os serviços. Tenta novamente." />
            ) : loadingServices ? (
              <LoadingGrid />
            ) : visibleServices.length === 0 ? (
              <Empty message="Ainda não há serviços disponíveis nesta categoria." />
            ) : (
              <div className="grid gap-3 pt-3.5 lg:grid-cols-2 lg:gap-4">
                {visibleServices.map((s: any) => (
                  <ServiceCard
                    key={s.id}
                    service={s}
                    onBook={() =>
                      setDrawerItem({
                        kind: "service",
                        img: s.img || s.image_url,
                        title: s.title || s.name,
                        price: s.price,
                      })
                    }
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {tab === "lojas" && (
          <section>
            <SectionTitle
              title="Marcas verificadas"
              sub="Empreendedoras da comunidade MUSA"
            />
            {errorVendors ? (
              <ErrorState message="Não foi possível carregar as marcas. Tenta novamente." />
            ) : loadingVendors ? (
              <LoadingGrid />
            ) : baseVendors.length === 0 ? (
              <Empty message="Ainda não existem lojas registadas." />
            ) : (
              <div className="grid grid-cols-2 gap-3.5 pt-3.5 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5">
                {baseVendors.map((v: any) => (
                  <VendorCard key={v.id || v.serial_id} vendor={{ ...v, name: v.name || v.business_name || v.full_name }} />
                ))}
              </div>
            )}
            <div className="mx-auto my-6 h-px max-w-md bg-gradient-to-r from-transparent via-primary to-transparent opacity-35" />
            <div className="neon-halo ink-panel overflow-hidden rounded-[20px] px-6 py-7 lg:px-10 lg:py-10">
              <h3 className="display relative text-[17px] lg:text-2xl">
                Tem um negócio de beleza?
              </h3>
              <p className="relative mt-1.5 max-w-md text-[11.5px] opacity-65 lg:text-sm">
                Junte-se à MUSA e venda para milhares de clientes em Luanda.{" "}
                <span className="font-semibold opacity-100">Publicação 100% gratuita.</span>
              </p>
              <button
                onClick={() => setSellOpen(true)}
                className="relative mt-3.5 rounded-xl bg-primary px-5 py-2.5 text-[11.5px] font-bold text-primary-foreground shadow-neon"
              >
                Começar a vender — Grátis
              </button>
            </div>
          </section>
        )}

        {tab === "seguidoras" && (
          <section>
            <SectionTitle
              title="Lojas que segues"
              sub="Acompanha as tuas marcas favoritas"
            />
            {!user ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <p className="mb-4 text-[13px] font-medium text-muted-foreground">
                  Inicia sessão para ver as lojas que segues.
                </p>
                <button
                  onClick={() => signInWithGoogle()}
                  className="rounded-xl bg-primary px-6 py-2.5 text-[12px] font-bold text-primary-foreground shadow-neon"
                >
                  Iniciar Sessão
                </button>
              </div>
            ) : loadingVendors || loadingFollows ? (
              <LoadingGrid />
            ) : followedVendors.length === 0 ? (
              <Empty message="Ainda não segues nenhuma loja." />
            ) : (
              <div className="grid grid-cols-2 gap-3.5 pt-3.5 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5">
                {followedVendors.map((v: any) => (
                  <VendorCard key={v.id || v.serial_id} vendor={{ ...v, name: v.name || v.business_name || v.full_name }} />
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-14 border-t border-border-soft">
        <div className="mx-auto w-full max-w-6xl px-5 py-10 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="display text-2xl">
                MUSA <span className="neon-text align-super text-[12px]">✦</span>
              </p>
              <p className="mt-2 text-[11px] text-muted-foreground leading-relaxed">
                O mercado de beleza & moda das mulheres de Luanda. Compre, agende e venda
                gratuitamente.
              </p>
            </div>
            <div>
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground">
                Explorar
              </p>
              {["Produtos", "Serviços", "Lojas & Marcas", "Promoções"].map((l) => (
                <p key={l} className="mb-2 text-[12.5px] text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
                  {l}
                </p>
              ))}
            </div>
            <div>
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground">
                Vendedoras
              </p>
              {["Criar conta grátis", "Como funciona", "Dúvidas frequentes", "Suporte"].map((l) => (
                <p key={l} className="mb-2 text-[12.5px] text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
                  {l}
                </p>
              ))}
            </div>
            <div>
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground">
                Contacto
              </p>
              <p className="mb-2 text-[12.5px] text-muted-foreground">Luanda, Angola</p>
              <p className="mb-2 text-[12.5px] text-muted-foreground">musa.luanda@gmail.com</p>
              <p className="mb-2 text-[12.5px] text-muted-foreground">+244 900 000 000</p>
            </div>
          </div>
          <div className="mt-8 flex flex-col items-center gap-2 border-t border-border-soft pt-6 sm:flex-row sm:justify-between">
            <p className="text-[10.5px] text-muted-foreground">
              © 2025 MUSA · Mercado de beleza & moda · Luanda, Angola
            </p>
            <p className="text-[10.5px] text-muted-foreground">
              Feito com ❤️ para as mulheres angolanas
            </p>
          </div>
        </div>
      </footer>

      <BottomNav onSellClick={() => setSellOpen(true)} />
      <ItemDrawer
        item={drawerItem}
        onClose={() => setDrawerItem(null)}
        onConfirm={confirm}
      />
      <SellModal open={sellOpen} onClose={() => setSellOpen(false)} />
    </div>
  );
}

function Pills({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pt-4 lg:mx-0 lg:flex-wrap lg:justify-center lg:px-0">
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className={cn(
            "shrink-0 rounded-full border px-4 py-2 text-xs font-semibold whitespace-nowrap transition-colors",
            value === o
              ? "border-primary bg-accent text-accent-foreground"
              : "border-border bg-card text-muted-foreground hover:text-foreground",
          )}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

function SectionTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="pt-4 lg:text-center">
      <h2 className="display text-[19px] lg:text-2xl">{title}</h2>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function Empty({ message = "Ainda não há produtos nesta categoria." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted mb-3">
        <ShoppingBag className="size-5 text-muted-foreground opacity-50" />
      </div>
      <p className="text-[13px] font-medium text-muted-foreground">{message}</p>
    </div>
  );
}

function LoadingGrid() {
  return (
    <div className="grid grid-cols-2 gap-3.5 pt-3.5 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex animate-pulse flex-col gap-2">
          <div className="aspect-[4/5] w-full rounded-2xl bg-muted" />
          <div className="h-4 w-3/4 rounded bg-muted" />
          <div className="h-3 w-1/2 rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="mt-4 rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-center text-sm text-destructive">
      {message}
    </div>
  );
}
