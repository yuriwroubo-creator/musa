/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect, useRef } from "react";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFollows } from "@/hooks/useFollows";
import { SiteHeader } from "@/components/musa/SiteHeader";
import { ProductCard, ServiceCard, VendorCard } from "@/components/musa/Cards";
import { ItemDrawer, type DrawerItem } from "@/components/musa/ItemDrawer";
import { useSellModal } from "@/lib/SellContext";
import { productCategories, serviceCategories } from "@/lib/musa-data";
import { cn } from "@/lib/utils";
import { Check, ChevronRight, Play, ShoppingBag, TrendingUp, Wand2, X } from "lucide-react";
import { useGlobalSearch } from "@/hooks/useGlobalSearch";
import heroLace from "@/assets/prod-lace.jpg";
import heroVestido from "@/assets/prod-vestido.jpg";
import {
  getTasteProfile,
  saveTasteProfile,
  scoreCatalogItem,
  tasteOptions,
  type TasteProfile,
} from "@/lib/personalization";

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

function normalizeSearch(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function editDistance(a: string, b: string) {
  if (a === b) return 0;
  if (!a) return b.length;
  if (!b) return a.length;

  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  const current = Array.from({ length: b.length + 1 }, () => 0);

  for (let i = 1; i <= a.length; i++) {
    current[0] = i;
    for (let j = 1; j <= b.length; j++) {
      current[j] = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    previous.splice(0, previous.length, ...current);
  }

  return previous[b.length];
}

function searchScore(item: any, query: string) {
  const normalizedQuery = normalizeSearch(query);
  if (!normalizedQuery) return 0;

  const text = normalizeSearch(
    [
      item.name,
      item.title,
      item.description,
      item.store,
      item.business_name,
      item.full_name,
      item.category,
      item.price,
    ].join(" "),
  );
  const words = text.split(/[^a-z0-9]+/).filter(Boolean);
  const queryWords = normalizedQuery.split(/[^a-z0-9]+/).filter(Boolean);

  let score = 0;
  if (text.includes(normalizedQuery)) score += 100;

  for (const queryWord of queryWords) {
    for (const word of words) {
      if (word === queryWord) score += 28;
      else if (word.includes(queryWord) || queryWord.includes(word)) score += 14;
      else {
        const distance = editDistance(word, queryWord);
        const tolerance = queryWord.length <= 5 ? 1 : 2;
        if (distance <= tolerance) score += 10 - distance;
      }
    }
  }

  return score;
}

function dedupeById<T extends { id?: string; objectID?: string }>(items: T[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const id = item.id || item.objectID;
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function Index() {
  const [tab, setTab] = useState<Tab>("produtos");
  const [prodCat, setProdCat] = useState("Todos");
  const [svcCat, setSvcCat] = useState("Todos");
  const [query, setQuery] = useState("");
  const [drawerItem, setDrawerItem] = useState<DrawerItem | null>(null);
  const { setSellOpen } = useSellModal();
  const [cart, setCart] = useState(0);
  const [tasteProfile, setTasteProfile] = useState<TasteProfile>(() => getTasteProfile());
  const [tasteOpen, setTasteOpen] = useState(false);

  const q = query.trim().toLowerCase();

  // Supabase Queries
  const {
    data: productsData,
    fetchNextPage: fetchNextProducts,
    hasNextPage: hasNextProducts,
    isFetchingNextPage: isFetchingNextProducts,
    isLoading: loadingProducts,
    error: errorProducts,
  } = useInfiniteQuery({
    queryKey: ["products_with_views"],
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === 12 ? allPages.length : undefined,
    queryFn: async ({ pageParam = 0 }) => {
      const { data, error } = await supabase
        .from("products_with_views")
        .select("*")
        .order("views_count", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .range(pageParam * 12, (pageParam + 1) * 12 - 1);
      if (error) throw error;
      return data || [];
    },
  });

  const {
    data: servicesData,
    fetchNextPage: fetchNextServices,
    hasNextPage: hasNextServices,
    isFetchingNextPage: isFetchingNextServices,
    isLoading: loadingServices,
    error: errorServices,
  } = useInfiniteQuery({
    queryKey: ["services"],
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === 12 ? allPages.length : undefined,
    queryFn: async ({ pageParam = 0 }) => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .order("created_at", { ascending: false })
        .range(pageParam * 12, (pageParam + 1) * 12 - 1);
      if (error) throw error;
      return data || [];
    },
  });

  const {
    data: dbVendors,
    isLoading: loadingVendors,
    error: errorVendors,
  } = useQuery({
    queryKey: ["vendor_subscriptions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendor_subscriptions")
        .select("id, serial_id, full_name, plan, status")
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data || []).map((vendor) => {
        const displayName = vendor.full_name || vendor.serial_id;

        return {
          id: vendor.id,
          name: displayName,
          cat: vendor.plan || vendor.status || "Loja",
          img: "",
        };
      });
    },
  });

  // Base Data (Flatten infinite pages)
  const dbProducts = useMemo(() => productsData?.pages.flat() || [], [productsData]);
  const dbServices = useMemo(() => servicesData?.pages.flat() || [], [servicesData]);
  const baseVendors = useMemo(() => dbVendors ?? [], [dbVendors]);

  const baseProducts = dbProducts;
  const baseServices = dbServices;

  const { follows, isLoading: loadingFollows } = useFollows();
  const { user, signInWithGoogle } = useAuth();

  useEffect(() => {
    if (!tasteProfile.completed) {
      const timer = window.setTimeout(() => setTasteOpen(true), user ? 650 : 1400);
      return () => window.clearTimeout(timer);
    }
  }, [tasteProfile.completed, user]);

  useEffect(() => {
    const normalized = query.trim().toLowerCase();
    if (normalized.length < 3) return;
    const timer = window.setTimeout(() => {
      setTasteProfile((current) => {
        const next = {
          ...current,
          searches: [normalized, ...current.searches.filter((item) => item !== normalized)].slice(
            0,
            10,
          ),
        };
        saveTasteProfile(next);
        return next;
      });
    }, 650);
    return () => window.clearTimeout(timer);
  }, [query]);

  const followedVendors = useMemo(() => {
    if (!follows) return [];
    const followedIds = follows.map((f) => f.following_id);
    return baseVendors.filter((v: any) => followedIds.includes(v.id || v.serial_id));
  }, [baseVendors, follows]);

  const { data: searchResults } = useGlobalSearch(query);
  const { data: databaseSearchResults, isLoading: loadingDatabaseSearch } = useQuery({
    queryKey: ["database-search", q],
    enabled: q.length > 1,
    queryFn: async () => {
      const search = q.replace(/[%_]/g, "");
      const [productsRes, servicesRes] = await Promise.all([
        supabase
          .from("products")
          .select("*")
          .or(`name.ilike.%${search}%,description.ilike.%${search}%,category.ilike.%${search}%`)
          .order("created_at", { ascending: false })
          .limit(80),
        supabase
          .from("services")
          .select("*")
          .or(`name.ilike.%${search}%,description.ilike.%${search}%,category.ilike.%${search}%`)
          .order("created_at", { ascending: false })
          .limit(80),
      ]);

      if (productsRes.error) throw productsRes.error;
      if (servicesRes.error) throw servicesRes.error;

      return {
        products: productsRes.data || [],
        services: servicesRes.data || [],
      };
    },
  });

  const visibleProducts = useMemo(() => {
    if (q !== "") {
      const algoliaProducts = (searchResults?.products ?? []).map((hit) => ({
        id: hit.objectID,
        store: hit.description || "Vendedora",
        name: hit.name || "Publicação",
        description: hit.description,
        price: hit.price ? `${hit.price.toLocaleString("pt-AO")} AOA` : "Preço sob consulta",
        rating: hit.name ? "Novo" : "",
        category: hit.category || "Geral",
        img: hit.image_url || "",
      }));
      const databaseProducts = (databaseSearchResults?.products ?? []).map((item: any) => ({
        ...item,
        store: item.store || item.vendor_name || "Loja",
        price:
          typeof item.price === "number"
            ? `${item.price.toLocaleString("pt-AO")} AOA`
            : item.price || "Preço sob consulta",
        rating: item.rating || "Novo",
        img:
          item.img ||
          item.image_url ||
          item.media_urls?.find((url: string) => /\.(jpg|jpeg|png|webp|heic|heif)$/i.test(url)) ||
          "",
      }));
      const fuzzyProducts = [...baseProducts]
        .filter((item: any) => searchScore(item, query) > 0)
        .map((item: any) => ({
          ...item,
          price:
            typeof item.price === "number"
              ? `${item.price.toLocaleString("pt-AO")} AOA`
              : item.price || "Preço sob consulta",
          rating: item.rating || "Novo",
          img:
            item.img ||
            item.image_url ||
            item.media_urls?.find((url: string) => /\.(jpg|jpeg|png|webp|heic|heif)$/i.test(url)) ||
            "",
        }));

      return dedupeById([...databaseProducts, ...algoliaProducts, ...fuzzyProducts])
        .map((item: any) => ({ ...item, _score: searchScore(item, query) }))
        .sort((a: any, b: any) => b._score - a._score)
        .slice(0, 24);
    }
    const filtered = baseProducts.filter(
      (p: any) => prodCat === "Todos" || prodCat === "Promoções" || p.category === prodCat,
    );
    return [...filtered].sort(
      (a: any, b: any) =>
        scoreCatalogItem(b, tasteProfile, query) - scoreCatalogItem(a, tasteProfile, query),
    );
  }, [q, searchResults, databaseSearchResults, prodCat, baseProducts, tasteProfile, query]);

  const visibleServices = useMemo(() => {
    if (q !== "") {
      const algoliaServices = (searchResults?.services ?? []).map((hit) => ({
        id: hit.objectID,
        name: hit.name || "Publicação",
        title: hit.description || "Serviço",
        description: hit.description,
        price: hit.price ? `${hit.price.toLocaleString("pt-AO")} AOA` : "Preço sob consulta",
        home: false,
        rating: hit.name ? "Novo" : "",
        category: hit.category || "Geral",
        img: hit.image_url || "",
      }));
      const databaseServices = (databaseSearchResults?.services ?? []).map((item: any) => ({
        ...item,
        title: item.title || item.description || item.name,
        price:
          typeof item.price === "number"
            ? `${item.price.toLocaleString("pt-AO")} AOA`
            : item.price || "Preço sob consulta",
        home: Boolean(item.home),
        rating: item.rating || "Novo",
        img:
          item.img ||
          item.image_url ||
          item.media_urls?.find((url: string) => /\.(jpg|jpeg|png|webp|heic|heif)$/i.test(url)) ||
          "",
      }));
      const fuzzyServices = [...baseServices]
        .filter((item: any) => searchScore(item, query) > 0)
        .map((item: any) => ({
          ...item,
          title: item.title || item.description || item.name,
          price:
            typeof item.price === "number"
              ? `${item.price.toLocaleString("pt-AO")} AOA`
              : item.price || "Preço sob consulta",
          home: Boolean(item.home),
          rating: item.rating || "Novo",
          img:
            item.img ||
            item.image_url ||
            item.media_urls?.find((url: string) => /\.(jpg|jpeg|png|webp|heic|heif)$/i.test(url)) ||
            "",
        }));

      return dedupeById([...databaseServices, ...algoliaServices, ...fuzzyServices])
        .map((item: any) => ({ ...item, _score: searchScore(item, query) }))
        .sort((a: any, b: any) => b._score - a._score)
        .slice(0, 24);
    }
    const filtered = baseServices.filter((s: any) => svcCat === "Todos" || s.category === svcCat);
    return [...filtered].sort(
      (a: any, b: any) =>
        scoreCatalogItem(b, tasteProfile, query) - scoreCatalogItem(a, tasteProfile, query),
    );
  }, [q, searchResults, databaseSearchResults, svcCat, baseServices, tasteProfile, query]);

  const forYouItems = useMemo(() => {
    const productItems = [...baseProducts].map((item: any) => ({
      ...item,
      _kind: "product" as const,
      _date: new Date(item.created_at || 0).getTime(),
      _taste: scoreCatalogItem(item, tasteProfile, ""),
    }));
    const serviceItems = [...baseServices].map((item: any) => ({
      ...item,
      _kind: "service" as const,
      _date: new Date(item.created_at || 0).getTime(),
      _taste: scoreCatalogItem(item, tasteProfile, ""),
    }));

    return [...productItems, ...serviceItems]
      .sort((a: any, b: any) => b._taste - a._taste || b._date - a._date)
      .slice(0, 8);
  }, [baseProducts, baseServices, tasteProfile]);

  const preferredLabels = useMemo(
    () =>
      tasteProfile.categories
        .slice(0, 3)
        .map(
          (category) => tasteOptions.find((option) => option.id === category)?.label || category,
        ),
    [tasteProfile.categories],
  );

  const recordInteraction = (item: any) => {
    setTasteProfile((current) => {
      const next = {
        ...current,
        interactions: {
          ...current.interactions,
          [item.id]: (current.interactions[item.id] || 0) + 1,
          [item.category]: (current.interactions[item.category] || 0) + 1,
        },
      };
      saveTasteProfile(next);
      return next;
    });
  };

  const confirm = (item: DrawerItem) => {
    setDrawerItem(null);
    if (item.kind === "product") {
      setCart((c) => c + 1);
      toast.success("Adicionado ao carrinho", { description: item.title });
    } else {
      toast.success("Agendamento confirmado! ✅", { description: item.title });
    }
  };

  // Intersection Observer for Infinite Scroll
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          if (tab === "produtos" && hasNextProducts && !isFetchingNextProducts) {
            fetchNextProducts();
          } else if (tab === "servicos" && hasNextServices && !isFetchingNextServices) {
            fetchNextServices();
          }
        }
      },
      { threshold: 0.1 },
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }
    return () => observer.disconnect();
  }, [
    tab,
    hasNextProducts,
    isFetchingNextProducts,
    fetchNextProducts,
    hasNextServices,
    isFetchingNextServices,
    fetchNextServices,
  ]);

  return (
    <div className="min-h-screen pb-28 lg:pb-0">
      <SiteHeader
        query={query}
        onQueryChange={setQuery}
        cartCount={cart}
        onCartClick={() =>
          toast(`Carrinho`, { description: `${cart} ${cart === 1 ? "item" : "itens"}` })
        }
        onSellClick={() => setSellOpen(true)}
      />

      <main className="mx-auto w-full max-w-6xl px-5 lg:px-8">
        <HeroExperience
          personalized={tasteProfile.completed}
          preferredLabels={preferredLabels}
          onPersonalize={() => setTasteOpen(true)}
          onSellClick={() => setSellOpen(true)}
        />

        <StoryRail
          categories={tasteOptions}
          selected={tab === "produtos" ? prodCat : svcCat}
          onSelect={(category) => {
            const serviceCategoriesSet = new Set(serviceCategories);
            if (serviceCategoriesSet.has(category)) {
              setTab("servicos");
              setSvcCat(category);
            } else {
              setTab("produtos");
              setProdCat(category);
            }
          }}
        />

        {/* Tabs */}
        <div
          role="tablist"
          className="glass-panel mt-4 flex gap-1.5 rounded-2xl p-1 lg:mx-auto lg:mt-8 lg:max-w-xl"
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

        {q !== "" ? (
          <SearchResultsView
            query={query.trim()}
            loading={loadingDatabaseSearch}
            products={visibleProducts}
            services={visibleServices}
            onProductClick={(p) => {
              recordInteraction(p);
              setDrawerItem({
                kind: "product",
                img: p.img || p.image_url,
                title: p.name,
                price: p.price,
              });
            }}
            onServiceClick={(s) => {
              recordInteraction(s);
              setDrawerItem({
                kind: "service",
                img: s.img || s.image_url,
                title: s.title || s.name,
                price: s.price,
              });
            }}
          />
        ) : (
          <>
            <ForYouFeed
              items={forYouItems}
              onProductClick={(p) => {
                recordInteraction(p);
                setDrawerItem({
                  kind: "product",
                  img: p.img || p.image_url,
                  title: p.name,
                  price: p.price,
                });
              }}
              onServiceClick={(s) => {
                recordInteraction(s);
                setDrawerItem({
                  kind: "service",
                  img: s.img || s.image_url,
                  title: s.title || s.name,
                  price: s.price,
                });
              }}
            />

            {tab === "produtos" && (
              <section>
                <Pills options={productCategories} value={prodCat} onChange={setProdCat} />
                <SectionTitle title="Selecionado para si" sub="" />
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
                        onBuy={() => {
                          recordInteraction(p);
                          setDrawerItem({
                            kind: "product",
                            img: p.img || p.image_url,
                            title: p.name,
                            price: p.price,
                          });
                        }}
                      />
                    ))}
                  </div>
                )}

                {(hasNextProducts || isFetchingNextProducts) && visibleProducts.length > 0 && (
                  <div ref={loadMoreRef} className="py-8 text-center">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                )}
              </section>
            )}

            {tab === "servicos" && (
              <section>
                <Pills options={serviceCategories} value={svcCat} onChange={setSvcCat} />
                <SectionTitle title="Profissionais perto de si" sub="" />
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
                        onBook={() => {
                          recordInteraction(s);
                          setDrawerItem({
                            kind: "service",
                            img: s.img || s.image_url,
                            title: s.title || s.name,
                            price: s.price,
                          });
                        }}
                      />
                    ))}
                  </div>
                )}

                {(hasNextServices || isFetchingNextServices) && visibleServices.length > 0 && (
                  <div ref={loadMoreRef} className="py-8 text-center">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                )}
              </section>
            )}

            {tab === "lojas" && (
              <section>
                <SectionTitle title="Marcas verificadas" sub="Empreendedoras da comunidade MUSA" />
                {errorVendors ? (
                  <ErrorState message="Não foi possível carregar as marcas. Tenta novamente." />
                ) : loadingVendors ? (
                  <LoadingGrid />
                ) : baseVendors.length === 0 ? (
                  <Empty message="Ainda não existem lojas registadas." />
                ) : (
                  <div className="grid grid-cols-2 gap-3.5 pt-3.5 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5">
                    {baseVendors.map((v: any) => (
                      <VendorCard
                        key={v.id || v.serial_id}
                        vendor={{ ...v, name: v.name || v.business_name || v.full_name }}
                      />
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
                <SectionTitle title="Lojas que segues" sub="Acompanha as tuas marcas favoritas" />
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
                      <VendorCard
                        key={v.id || v.serial_id}
                        vendor={{ ...v, name: v.name || v.business_name || v.full_name }}
                      />
                    ))}
                  </div>
                )}
              </section>
            )}
          </>
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
                <p
                  key={l}
                  className="mb-2 text-[12.5px] text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                >
                  {l}
                </p>
              ))}
            </div>
            <div>
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground">
                Vendedoras
              </p>
              {["Criar conta grátis", "Como funciona", "Dúvidas frequentes", "Suporte"].map((l) => (
                <p
                  key={l}
                  className="mb-2 text-[12.5px] text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                >
                  {l}
                </p>
              ))}
            </div>
            <div>
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground">
                Contacto
              </p>
              <p className="mb-2 text-[12.5px] text-muted-foreground">Luanda, Angola</p>
              <a
                href="mailto:romacristiano77@gmail.com"
                className="mb-2 block text-[12.5px] text-muted-foreground transition-colors hover:text-foreground"
              >
                romacristiano77@gmail.com
              </a>
              <a
                href="tel:+244946419129"
                className="mb-2 block text-[12.5px] text-muted-foreground transition-colors hover:text-foreground"
              >
                +244 946 419 129
              </a>
            </div>
          </div>
          <div className="mt-8 flex flex-col items-center gap-2 border-t border-border-soft pt-6 sm:flex-row sm:justify-between">
            <p className="text-[10.5px] text-muted-foreground">
              © MUSA · Mercado de beleza & moda · Luanda, Angola
            </p>
            <p className="text-[10.5px] text-muted-foreground">
              Feito com ❤️ para as mulheres angolanas
            </p>
          </div>
        </div>
      </footer>

      <ItemDrawer item={drawerItem} onClose={() => setDrawerItem(null)} onConfirm={confirm} />
      <TasteOnboarding
        open={tasteOpen}
        profile={tasteProfile}
        onClose={() => setTasteOpen(false)}
        onSave={(categories) => {
          const next = { ...tasteProfile, categories, completed: true };
          setTasteProfile(next);
          saveTasteProfile(next);
          setTasteOpen(false);
          toast.success("Feed personalizado", {
            description: "A MUSA vai priorizar conteúdos alinhados aos teus gostos.",
          });
        }}
      />
    </div>
  );
}

function SearchResultsView({
  query,
  loading,
  products,
  services,
  onProductClick,
  onServiceClick,
}: {
  query: string;
  loading: boolean;
  products: any[];
  services: any[];
  onProductClick: (product: any) => void;
  onServiceClick: (service: any) => void;
}) {
  const hasResults = products.length > 0 || services.length > 0;

  return (
    <section className="pt-5">
      <SectionTitle
        title={`Resultados para "${query}"`}
        sub="Produtos e serviços encontrados na MUSA"
      />
      {loading && !hasResults ? (
        <LoadingGrid />
      ) : !hasResults ? (
        <Empty message={`Não foi encontrado nenhum resultado para "${query}".`} />
      ) : (
        <div className="space-y-7">
          {products.length > 0 && (
            <div>
              <h3 className="pt-3 text-sm font-black">Produtos</h3>
              <div className="grid grid-cols-2 gap-3.5 pt-3.5 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5">
                {products.map((product: any) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onBuy={() => onProductClick(product)}
                  />
                ))}
              </div>
            </div>
          )}

          {services.length > 0 && (
            <div>
              <h3 className="pt-3 text-sm font-black">Serviços</h3>
              <div className="grid gap-3 pt-3.5 lg:grid-cols-2 lg:gap-4">
                {services.map((service: any) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    onBook={() => onServiceClick(service)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function ForYouFeed({
  items,
  onProductClick,
  onServiceClick,
}: {
  items: any[];
  onProductClick: (product: any) => void;
  onServiceClick: (service: any) => void;
}) {
  return (
    <section id="for-you-feed" className="pt-5">
      <div className="flex items-end justify-between gap-3">
        <SectionTitle title="Para você" sub="Últimas publicações alinhadas ao teu gosto" />
        <span className="mb-1 hidden rounded-full bg-accent px-3 py-1 text-[10px] font-bold text-accent-foreground sm:inline-flex">
          Feed
        </span>
      </div>
      {items.length === 0 ? (
        <Empty message="O feed Para você vai aparecer aqui quando houver publicações reais." />
      ) : (
      <div className="no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5 pt-3.5 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0">
        {items.map((item: any) =>
          item._kind === "product" ? (
            <div key={`feed-product-${item.id}`} className="w-[168px] shrink-0 lg:w-auto">
              <ProductCard
                product={{
                  ...item,
                  price:
                    typeof item.price === "number"
                      ? `${item.price.toLocaleString("pt-AO")} AOA`
                      : item.price || "Preço sob consulta",
                  rating: item.rating || "Novo",
                  store: item.store || item.vendor_name || "Loja",
                  img:
                    item.img ||
                    item.image_url ||
                    item.media_urls?.find((url: string) =>
                      /\.(jpg|jpeg|png|webp|heic|heif)$/i.test(url),
                    ) ||
                    "",
                }}
                onBuy={() => onProductClick(item)}
              />
            </div>
          ) : (
            <div key={`feed-service-${item.id}`} className="w-[280px] shrink-0 lg:w-auto">
              <ServiceCard
                service={{
                  ...item,
                  title: item.title || item.description || item.name,
                  price:
                    typeof item.price === "number"
                      ? `${item.price.toLocaleString("pt-AO")} AOA`
                      : item.price || "Preço sob consulta",
                  home: Boolean(item.home),
                  rating: item.rating || "Novo",
                  img:
                    item.img ||
                    item.image_url ||
                    item.media_urls?.find((url: string) =>
                      /\.(jpg|jpeg|png|webp|heic|heif)$/i.test(url),
                    ) ||
                    "",
                }}
                onBook={() => onServiceClick(item)}
              />
            </div>
          ),
        )}
      </div>
      )}
    </section>
  );
}

function HeroExperience({
  personalized,
  preferredLabels,
  onPersonalize,
  onSellClick,
}: {
  personalized: boolean;
  preferredLabels: string[];
  onPersonalize: () => void;
  onSellClick: () => void;
}) {
  return (
    <section className="relative isolate mt-5 overflow-hidden rounded-[28px] bg-foreground text-background shadow-luxe lg:mt-8">
      <img src={heroLace} alt="" className="absolute inset-0 size-full object-cover opacity-45" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/88 via-black/58 to-black/16" />
      <div className="relative grid min-h-[360px] gap-8 px-5 py-7 sm:px-8 lg:grid-cols-[1.08fr_0.92fr] lg:px-10 lg:py-10">
        <div className="flex max-w-xl flex-col justify-between">
          <div>
            <h1 className="display max-w-[11ch] text-[3rem] leading-[0.92] text-white sm:text-[4.4rem] lg:text-[5.3rem]">
              MUSA
            </h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-white/76 lg:text-[15px]">
              Uma vitrine chique para descobrir laces, moda, make, unhas, serviços e criadoras com
              um feed que aprende com os teus gostos.
            </p>
          </div>
          <div className="mt-7 flex flex-wrap gap-2.5">
            <button
              onClick={onPersonalize}
              className="sheen inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-xs font-bold text-white shadow-neon-lg transition active:scale-95"
            >
              <Wand2 className="size-4" />
              {personalized ? "Ajustar gostos" : "Criar o meu feed"}
            </button>
            <button
              onClick={onSellClick}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-3 text-xs font-bold text-white backdrop-blur-xl transition hover:bg-white/16 active:scale-95"
            >
              Publicar grátis
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>

        <div className="hidden items-end justify-end lg:flex">
          <div className="animate-float-soft w-[310px] rounded-[28px] border border-white/18 bg-white/12 p-3 shadow-luxe backdrop-blur-2xl">
            <div className="relative aspect-[9/13] overflow-hidden rounded-[22px]">
              <img src={heroVestido} alt="Moda MUSA" className="size-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/78 to-transparent p-4 text-white">
                <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold">
                  <Play className="size-3.5 fill-white" />
                  Para si agora
                </div>
                <p className="text-sm font-bold">Vestidos, glow e serviços que combinam contigo.</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {(preferredLabels.length
                    ? preferredLabels
                    : ["Moda elegante", "Glow & make"]
                  ).map((label) => (
                    <span
                      key={label}
                      className="rounded-full bg-white/16 px-2.5 py-1 text-[10px] font-semibold backdrop-blur"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StoryRail({
  categories,
  selected,
  onSelect,
}: {
  categories: typeof tasteOptions;
  selected: string;
  onSelect: (category: string) => void;
}) {
  return (
    <div className="no-scrollbar -mx-5 mt-5 flex gap-3 overflow-x-auto px-5 pb-1 lg:mx-0 lg:px-0">
      {categories.slice(0, 9).map((category) => (
        <button
          key={category.id}
          onClick={() => onSelect(category.id)}
          className="group flex w-[76px] shrink-0 flex-col items-center gap-2 text-center"
        >
          <span
            className={cn(
              "relative flex size-[64px] items-center justify-center rounded-full p-[2px] transition duration-300 group-hover:-translate-y-1",
              selected === category.id
                ? "bg-gradient-to-br from-primary via-[color:var(--gold)] to-[color:var(--jade)]"
                : "bg-gradient-to-br from-primary/60 via-border to-accent",
            )}
          >
            <span className="flex size-full items-center justify-center rounded-full bg-card text-[10px] font-black uppercase text-foreground">
              {category.label.split(" ")[0]}
            </span>
          </span>
          <span className="line-clamp-2 text-[10px] font-semibold leading-tight text-muted-foreground">
            {category.label}
          </span>
        </button>
      ))}
    </div>
  );
}

function TasteOnboarding({
  open,
  profile,
  onClose,
  onSave,
}: {
  open: boolean;
  profile: TasteProfile;
  onClose: () => void;
  onSave: (categories: string[]) => void;
}) {
  const [selected, setSelected] = useState<string[]>(profile.categories);

  useEffect(() => {
    if (open) setSelected(profile.categories);
  }, [open, profile.categories]);

  if (!open) return null;

  const toggle = (id: string) => {
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id].slice(0, 6),
    );
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end bg-foreground/45 px-3 pb-3 backdrop-blur-sm sm:items-center sm:justify-center sm:p-5">
      <div className="animate-rise w-full max-w-xl rounded-[28px] bg-card p-4 shadow-luxe sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-[10px] font-bold uppercase text-accent-foreground">
              <TrendingUp className="size-3" />
              Feed inteligente
            </p>
            <h2 className="display text-3xl leading-none text-foreground">Escolhe o teu mood</h2>
            <p className="mt-2 text-sm leading-5 text-muted-foreground">
              Toca nas opções que combinam contigo. A MUSA usa isto para ordenar produtos, serviços
              e marcas no teu “Para si”.
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {tasteOptions.map((option) => {
            const active = selected.includes(option.id);
            return (
              <button
                key={option.id}
                onClick={() => toggle(option.id)}
                className={cn(
                  "min-h-[76px] rounded-2xl border p-3 text-left transition-all active:scale-[0.98]",
                  active
                    ? "border-primary bg-primary text-primary-foreground shadow-neon"
                    : "border-border-soft bg-secondary/70 text-foreground hover:border-primary/45",
                )}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="text-[12px] font-bold leading-tight">{option.label}</span>
                  {active && <Check className="size-4 shrink-0" />}
                </span>
                <span
                  className={cn(
                    "mt-2 block text-[10px]",
                    active ? "text-white/78" : "text-muted-foreground",
                  )}
                >
                  {option.id}
                </span>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => onSave(selected)}
          disabled={selected.length === 0}
          className="sheen mt-5 w-full rounded-2xl bg-primary py-3 text-sm font-bold text-primary-foreground shadow-neon disabled:opacity-45"
        >
          Guardar e ver recomendações
        </button>
      </div>
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
