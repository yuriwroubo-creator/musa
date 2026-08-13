import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { useFavorites } from "@/hooks/useFavorites";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/musa/SiteHeader";
import { ProductCard, ServiceCard } from "@/components/musa/Cards";
import { Heart } from "lucide-react";
import { ItemDrawer, type DrawerItem } from "@/components/musa/ItemDrawer";
import { SellModal } from "@/components/musa/SellModal";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/favoritos")({
  component: FavoritesPage,
});

function FavoritesPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { favorites, isLoading: loadingFavorites } = useFavorites();
  
  const [drawerItem, setDrawerItem] = useState<DrawerItem | null>(null);
  const [sellOpen, setSellOpen] = useState(false);
  const [tab, setTab] = useState<"produtos" | "servicos">("produtos");

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/", replace: true });
    }
  }, [user, loading, navigate]);

  const productIds = favorites.filter((f) => f.item_type === "product").map((f) => f.item_id);
  const serviceIds = favorites.filter((f) => f.item_type === "service").map((f) => f.item_id);

  const { data: favoriteProducts = [], isLoading: loadingProducts } = useQuery({
    queryKey: ["favorite_products", productIds],
    queryFn: async () => {
      if (productIds.length === 0) return [];
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .in("id", productIds);
      if (error) throw error;
      return data;
    },
    enabled: productIds.length > 0,
  });

  const { data: favoriteServices = [], isLoading: loadingServices } = useQuery({
    queryKey: ["favorite_services", serviceIds],
    queryFn: async () => {
      if (serviceIds.length === 0) return [];
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .in("id", serviceIds);
      if (error) throw error;
      return data;
    },
    enabled: serviceIds.length > 0,
  });

  if (loading || !user) {
    return <div className="flex min-h-screen items-center justify-center">A carregar...</div>;
  }

  const isLoadingData = loadingFavorites || loadingProducts || loadingServices;
  
  const confirm = (item: DrawerItem) => {
    setDrawerItem(null);
    if (item.kind === "product") {
      toast.success("Adicionado ao carrinho", { description: item.title });
    } else {
      toast.success("Agendamento confirmado! ✅", { description: item.title });
    }
  };

  return (
    <div className="min-h-screen pb-28 lg:pb-0 bg-background">
      <SiteHeader
        query=""
        onQueryChange={() => {}}
        cartCount={0}
        onCartClick={() => {}}
        onSellClick={() => setSellOpen(true)}
      />
      <main className="mx-auto w-full max-w-6xl px-5 pt-8 lg:px-8">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
            <Heart className="size-6 fill-primary text-primary" />
          </div>
          <div>
            <h1 className="display text-2xl lg:text-3xl">Os Meus Favoritos</h1>
            <p className="mt-1 text-sm text-muted-foreground">Itens guardados para mais tarde</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-1.5 rounded-2xl border border-border-soft bg-card p-1 max-w-xs">
          {(["produtos", "servicos"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-xl px-1 py-2.5 text-[12px] font-semibold transition-all duration-300",
                tab === t
                  ? "bg-primary text-primary-foreground shadow-neon"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t === "produtos" ? "Produtos" : "Serviços"}
            </button>
          ))}
        </div>

        {isLoadingData ? (
          <div className="grid grid-cols-2 gap-3.5 pt-3.5 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex animate-pulse flex-col gap-2">
                <div className="aspect-[4/5] w-full rounded-2xl bg-muted" />
                <div className="h-4 w-3/4 rounded bg-muted" />
              </div>
            ))}
          </div>
        ) : tab === "produtos" && favoriteProducts.length === 0 ? (
          <EmptyState message="Ainda não tens produtos guardados nos favoritos." />
        ) : tab === "produtos" && favoriteProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-3.5 pt-3.5 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5">
            {favoriteProducts.map((p: any) => (
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
        ) : tab === "servicos" && favoriteServices.length === 0 ? (
          <EmptyState message="Ainda não tens serviços guardados nos favoritos." />
        ) : tab === "servicos" && favoriteServices.length > 0 ? (
          <div className="grid gap-3 pt-3.5 lg:grid-cols-2 lg:gap-4">
            {favoriteServices.map((s: any) => (
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
        ) : null}
      </main>

      <ItemDrawer
        item={drawerItem}
        onClose={() => setDrawerItem(null)}
        onConfirm={confirm}
      />
      <SellModal open={sellOpen} onClose={() => setSellOpen(false)} />
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-muted mb-4">
        <Heart className="size-6 text-muted-foreground opacity-50" />
      </div>
      <p className="max-w-[250px] text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
