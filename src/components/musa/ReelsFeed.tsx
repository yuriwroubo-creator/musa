import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useRef, useEffect } from "react";
import {
  Heart,
  MessageCircle,
  Share2,
  Volume2,
  VolumeX,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { BuyModal } from "@/components/musa/BuyModal";
import { DetailModal } from "@/components/musa/DetailModal";
import { CommentsModal } from "@/components/musa/CommentsModal";
import { useNavigate } from "@tanstack/react-router";

function isVideoUrl(url: string) {
  return /\.(mp4|webm|ogg|mov|m4v)$/i.test(url);
}

function mapReelItem(item: Record<string, unknown>, type: "product" | "service") {
  const profiles = (item.profiles as Record<string, unknown> | null) ||
    (item.vendor_subscriptions?.profiles as Record<string, unknown> | null) || null;
  const vendor = item.vendor_subscriptions as Record<string, unknown> | null;
  const mediaUrls = item.media_urls as string[] | undefined;
  const mediaUrl =
    (item.img as string) ||
    (item.image_url as string) ||
    mediaUrls?.[0] ||
    "";

  return {
    ...item,
    type,
    media_url: mediaUrl,
    title: (item.name as string) || (item.title as string) || "",
    price: item.price,
    store_name:
      (vendor?.business_name as string) || (vendor?.store_name as string) || (item.store_name as string) ||
      (item.store as string),
    profile: profiles,
    username: (profiles?.username as string) || (vendor?.profiles?.username as string) || undefined,
  };
}

export function ReelsFeed() {
  const [buyModalItem, setBuyModalItem] = useState<Record<string, unknown> | null>(null);
  const [detailModalItem, setDetailModalItem] = useState<Record<string, unknown> | null>(null);
  const [commentsModalItem, setCommentsModalItem] = useState<Record<string, unknown> | null>(null);
  const [muted, setMuted] = useState(true);
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const { user, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const {
    data: reelsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery({
    queryKey: ["reels", "is_reel"],
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === 10 ? allPages.length : undefined,
    queryFn: async ({ pageParam = 0 }) => {
      const [productsRes, servicesRes] = await Promise.all([
        supabase
          .from("products")
          // ensure we pull vendor data (vendor_subscriptions) and nested profile where available
          .select("*, vendor_subscriptions(*, profiles(*))")
          .eq("is_reel", true)
          .order("created_at", { ascending: false })
          .range(pageParam * 5, (pageParam + 1) * 5 - 1),
        supabase
          .from("services")
          .select("*, vendor_subscriptions(*, profiles(*))")
          .eq("is_reel", true)
          .order("created_at", { ascending: false })
          .range(pageParam * 5, (pageParam + 1) * 5 - 1),
      ]);

      if (productsRes.error) throw productsRes.error;
      if (servicesRes.error) throw servicesRes.error;

      const products = (productsRes.data || []).map((item) =>
        mapReelItem(item as Record<string, unknown>, "product"),
      );
      const services = (servicesRes.data || []).map((item) =>
        mapReelItem(item as Record<string, unknown>, "service"),
      );

      return [...products, ...services].sort(
        (a, b) =>
          new Date(String(b.created_at)).getTime() - new Date(String(a.created_at)).getTime(),
      );
    },
  });

  const allReels = reelsData?.pages.flat() || [];

  const reels = searchQuery.trim()
    ? allReels.filter((item) => {
        const q = searchQuery.toLowerCase();
        const vendor = item.vendor_subscriptions || null;
        const storeName =
          (vendor?.business_name as string) ||
          (vendor?.full_name as string) ||
          (item.profile?.full_name as string) ||
          (item.store_name as string) ||
          "";
        const username = (vendor?.profiles?.username as string) || (item.profile?.username as string) || "";
        const title = (item.title as string) || "";
        return (
          storeName.toLowerCase().includes(q) ||
          username.toLowerCase().includes(q) ||
          title.toLowerCase().includes(q)
        );
      })
    : allReels;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target as HTMLVideoElement;
          if (entry.isIntersecting) {
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.7, root: container },
    );

    const videos = container.querySelectorAll("video");
    videos.forEach((video) => observer.observe(video));

    return () => observer.disconnect();
  }, [reels]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      if (scrollHeight - scrollTop - clientHeight < 500 && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleLike = (itemId: string) => {
    if (!user) {
      signInWithGoogle();
      return;
    }
    setLikedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const handleShare = async (item: Record<string, unknown>) => {
    const title = (item.title as string) || "Reel MUSA";
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: `Vê este reel na MUSA: ${title}`,
          url: window.location.href,
        });
      } catch {
        /* cancelled */
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-black">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-black px-4">
        <p className="text-center text-sm text-white/70">
          Não foi possível carregar os reels. Tenta novamente.
        </p>
      </div>
    );
  }

  if (allReels.length === 0) {
    return (
      <div className="relative flex h-[100dvh] flex-col bg-black">
        <div className="absolute left-0 right-0 top-0 z-20 px-4 pt-4">
          <div className="flex items-center gap-2 rounded-full bg-black/40 px-4 py-2.5 backdrop-blur-md">
            <Search className="size-4 shrink-0 text-white/60" />
            <input
              type="search"
              placeholder="Pesquisar perfil ou loja..."
              className="w-full bg-transparent text-sm text-white placeholder:text-white/50 outline-none"
              disabled
            />
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center px-4">
          <div className="max-w-md text-center">
            <h2 className="text-xl font-bold text-white">Ainda não há reels</h2>
            <p className="mt-2 text-sm text-white/60">
              Publica o teu primeiro reel com o botão + e escolhe &quot;Publicar no Reels&quot;.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black">
      {/* Floating search bar — fixed above scroll */}
      <div className="absolute left-0 right-0 top-0 z-20 px-4 pt-4">
        <div className="flex items-center gap-2 rounded-full bg-black/40 px-4 py-2.5 backdrop-blur-md">
          <Search className="size-4 shrink-0 text-white/60" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar perfil ou loja..."
            className="w-full bg-transparent text-sm text-white placeholder:text-white/50 outline-none"
          />
        </div>
      </div>

      <div
        ref={containerRef}
        className="h-[100dvh] overflow-y-scroll scroll-smooth snap-y snap-mandatory"
      >
        {reels.length === 0 && searchQuery.trim() ? (
          <div className="flex h-[100dvh] snap-start items-center justify-center px-4">
            <p className="text-center text-sm text-white/60">
              Nenhum reel encontrado para &quot;{searchQuery}&quot;.
            </p>
          </div>
        ) : (
          reels.map((item, index) => {
            const itemId = String(item.id);
            const profile = (item.profile as Record<string, unknown> | null) ||
              (item.vendor_subscriptions?.profiles as Record<string, unknown> | null) || null;
            const storeLabel =
              (profile?.username as string) ||
              (profile?.full_name as string) ||
              (item.store_name as string) ||
              "loja";
            const mediaUrl = item.media_url as string;

            return (
              <div
                key={`${item.type}-${itemId}-${index}`}
                className="relative snap-start h-[100dvh] w-full"
              >
                <div className="absolute inset-0 bg-muted">
                  {mediaUrl && isVideoUrl(mediaUrl) ? (
                    <video
                      src={mediaUrl}
                      className="size-full object-cover"
                      loop
                      playsInline
                      muted={muted}
                      preload="metadata"
                    />
                  ) : mediaUrl ? (
                    <img
                      src={mediaUrl}
                      alt={item.title as string}
                      className="size-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                      <span className="text-4xl font-bold text-white/20">
                        {(item.title as string)?.[0] || "?"}
                      </span>
                    </div>
                  )}
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                <button
                  onClick={() => setMuted(!muted)}
                  className="absolute right-4 top-16 flex size-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition hover:bg-white/30"
                  aria-label={muted ? "Ativar som" : "Silenciar"}
                >
                  {muted ? (
                    <VolumeX className="size-5 text-white" />
                  ) : (
                    <Volume2 className="size-5 text-white" />
                  )}
                </button>

                {/* Bottom overlay */}
                <div className="absolute bottom-24 left-4 right-20 max-w-md">
                  <button
                    onClick={() => {
                      const profileId =
                        (profile?.id as string) || (item.vendor_subscriptions?.user_id as string) ||
                        (item.vendor_subscriptions?.vendor_id as string) || null;
                      if (profileId) navigate({ to: "/store/$id", params: { id: profileId } });
                    }}
                    className="mb-1 text-sm font-bold text-white text-left"
                  >
                    @{storeLabel}
                  </button>
                  <p className="mb-2 line-clamp-3 text-sm text-white/90">
                    {(item.description as string) || (item.title as string)}
                  </p>
                  {item.price != null && (
                    <p className="mb-3 text-lg font-bold text-primary">
                      {typeof item.price === "number"
                        ? new Intl.NumberFormat("pt-AO", {
                            style: "currency",
                            currency: "AOA",
                            minimumFractionDigits: 0,
                          }).format(item.price as number)
                        : String(item.price)}
                    </p>
                  )}
                  <div className="flex gap-3">
                    <button
                      onClick={() => setBuyModalItem(item)}
                      className="rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-white shadow-lg transition hover:scale-105 active:scale-95"
                    >
                      Comprar
                    </button>
                    <button
                      onClick={() => setDetailModalItem(item)}
                      className="rounded-full border border-white/10 bg-white/8 px-4 py-2.5 text-sm font-bold text-white/90 transition hover:border-white/20 hover:bg-white/12 active:scale-95"
                    >
                      Ver mais
                    </button>
                  </div>
                </div>

                {/* Right side actions */}
                <div className="absolute bottom-28 right-4 flex flex-col gap-5">
                  <button
                    onClick={() => handleLike(itemId)}
                    className="flex flex-col items-center gap-1 transition hover:scale-110 active:scale-95"
                    aria-label="Curtir"
                  >
                    <div className="flex size-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                      <Heart
                        className={cn(
                          "size-6 transition-colors",
                          likedItems.has(itemId)
                            ? "fill-[#FF5BA3] text-[#FF5BA3]"
                            : "text-white",
                        )}
                      />
                    </div>
                    <span className="text-xs font-medium text-white">Curtir</span>
                  </button>

                  <button
                    onClick={() => setCommentsModalItem(item)}
                    className="flex flex-col items-center gap-1 transition hover:scale-110 active:scale-95"
                    aria-label="Comentar"
                  >
                    <div className="flex size-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                      <MessageCircle className="size-6 text-white" />
                    </div>
                    <span className="text-xs font-medium text-white">Comentar</span>
                  </button>

                  <button
                    onClick={() => handleShare(item)}
                    className="flex flex-col items-center gap-1 transition hover:scale-110 active:scale-95"
                    aria-label="Partilhar"
                  >
                    <div className="flex size-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                      <Share2 className="size-6 text-white" />
                    </div>
                    <span className="text-xs font-medium text-white">Partilhar</span>
                  </button>

                  <button
                    onClick={() => {
                      const phone =
                        (item.whatsapp as string) ||
                        (item.phone as string) ||
                        (profile?.whatsapp as string) ||
                        (profile?.phone as string);
                      if (phone) {
                        window.open(`https://wa.me/${phone.replace(/\D/g, "")}`, "_blank");
                      }
                    }}
                    className="flex flex-col items-center gap-1 transition hover:scale-110 active:scale-95"
                    aria-label="WhatsApp"
                  >
                    <div className="flex size-12 items-center justify-center rounded-full bg-[#25D366]/80 backdrop-blur-sm">
                      <MessageCircle className="size-6 text-white" />
                    </div>
                    <span className="text-xs font-medium text-white">WhatsApp</span>
                  </button>
                </div>
              </div>
            );
          })
        )}

        {isFetchingNextPage && (
          <div className="flex h-24 snap-start items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}
      </div>

      <BuyModal
        open={!!buyModalItem}
        onClose={() => setBuyModalItem(null)}
        product={
          buyModalItem
            ? {
                name: (buyModalItem.name as string) || (buyModalItem.title as string) || "",
                price: (buyModalItem.price as number) || 0,
                category: (buyModalItem.category as string) || "",
                store:
                  (buyModalItem.store as string) ||
                  (buyModalItem.vendor_name as string) ||
                  (buyModalItem.vendor_subscriptions?.business_name as string) ||
                  "",
                whatsapp:
                  (buyModalItem.whatsapp as string) ||
                  (buyModalItem.vendor_subscriptions?.whatsapp as string) ||
                  (buyModalItem.vendor_subscriptions?.phone as string) ||
                  (buyModalItem.phone as string) ||
                  undefined,
                vendor_phone:
                  (buyModalItem.vendor_phone as string) || (buyModalItem.vendor_subscriptions?.phone as string) || undefined,
                phone: (buyModalItem.phone as string) || (buyModalItem.vendor_subscriptions?.phone as string) || undefined,
                variants: (buyModalItem.variants as null) || null,
              }
            : { name: "", price: 0, category: "", store: "" }
        }
      />
      <CommentsModal
        open={!!commentsModalItem}
        onClose={() => setCommentsModalItem(null)}
        post={commentsModalItem || null}
      />
      <DetailModal open={!!detailModalItem} onClose={() => setDetailModalItem(null)} item={detailModalItem || {}} />
    </div>
  );
}
