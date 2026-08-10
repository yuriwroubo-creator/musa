import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
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
import { ShoppingBag, Sparkles, BadgeCheck } from "lucide-react";

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

type Tab = "produtos" | "servicos" | "lojas";

const tabs: { id: Tab; label: string; emoji: string }[] = [
  { id: "produtos", label: "Produtos", emoji: "🛍️" },
  { id: "servicos", label: "Serviços", emoji: "✨" },
  { id: "lojas", label: "Lojas & Marcas", emoji: "🏪" },
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

  const visibleProducts = useMemo(
    () =>
      products.filter(
        (p) =>
          (prodCat === "Todos" || prodCat === "Promoções" || p.category === prodCat) &&
          (q === "" ||
            p.name.toLowerCase().includes(q) ||
            p.store.toLowerCase().includes(q)),
      ),
    [prodCat, q],
  );

  const visibleServices = useMemo(
    () =>
      services.filter(
        (s) =>
          (svcCat === "Todos" || s.category === svcCat) &&
          (q === "" ||
            s.name.toLowerCase().includes(q) ||
            s.title.toLowerCase().includes(q)),
      ),
    [svcCat, q],
  );

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

        {/* Stats strip */}
        <div className="mt-5 flex items-center gap-4 overflow-x-auto no-scrollbar lg:justify-center lg:mt-7">
          {[
            { icon: ShoppingBag, label: "Produtos disponíveis", value: "128+" },
            { icon: Sparkles, label: "Profissionais verificadas", value: "40+" },
            { icon: BadgeCheck, label: "Avaliação média", value: "4.9 ⭐" },
          ].map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className="flex shrink-0 items-center gap-2.5 rounded-2xl border border-border-soft bg-card px-4 py-2.5"
            >
              <Icon className="size-4 text-primary" strokeWidth={1.6} />
              <div>
                <p className="font-mono text-[13px] font-bold text-foreground">{value}</p>
                <p className="text-[9.5px] text-muted-foreground">{label}</p>
              </div>
            </div>
          ))}
        </div>

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
              sub={`${visibleProducts.length} peças de vendedoras verificadas`}
            />
            <div className="grid grid-cols-2 gap-3.5 pt-3.5 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5">
              {visibleProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onBuy={() =>
                    setDrawerItem({
                      kind: "product",
                      img: p.img,
                      title: p.name,
                      price: p.price,
                    })
                  }
                />
              ))}
            </div>
            {visibleProducts.length === 0 && <Empty />}
          </section>
        )}

        {tab === "servicos" && (
          <section>
            <Pills options={serviceCategories} value={svcCat} onChange={setSvcCat} />
            <SectionTitle
              title="Profissionais perto de si"
              sub="Agende com especialistas avaliadas"
            />
            <div className="grid gap-3 pt-3.5 lg:grid-cols-2 lg:gap-4">
              {visibleServices.map((s) => (
                <ServiceCard
                  key={s.id}
                  service={s}
                  onBook={() =>
                    setDrawerItem({
                      kind: "service",
                      img: s.img,
                      title: s.title,
                      price: s.price,
                    })
                  }
                />
              ))}
            </div>
            {visibleServices.length === 0 && <Empty />}
          </section>
        )}

        {tab === "lojas" && (
          <section>
            <SectionTitle
              title="Marcas verificadas"
              sub="Empreendedoras da comunidade MUSA"
            />
            <div className="grid grid-cols-2 gap-3.5 pt-3.5 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5">
              {vendors.map((v) => (
                <VendorCard key={v.id} vendor={v} />
              ))}
            </div>
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

function SectionTitle({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="pt-4 lg:text-center">
      <h2 className="display text-[19px] lg:text-2xl">{title}</h2>
      <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

function Empty() {
  return (
    <p className="py-14 text-center text-sm text-muted-foreground">
      Nada encontrado. Tente outra categoria ou pesquisa.
    </p>
  );
}
