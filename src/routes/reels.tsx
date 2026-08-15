import { createFileRoute } from "@tanstack/react-router";
import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useRef, useEffect } from "react";
import { Heart, Bookmark, MessageCircle, Share2, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useFavorites } from "@/hooks/useFavorites";
import { BuyModal } from "@/components/musa/BuyModal";

export const Route = createFileRoute("/reels")({
  component: ReelsPage,
});

function ReelsPage() {
  const [buyModalItem, setBuyModalItem] = useState<any | null>(null);
  const [muted, setMuted] = useState(true);
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());
  const [savedItems, setSavedItems] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const { user, signInWithGoogle } = useAuth();
  const { checkIsFavorite, toggleFavorite } = useFavorites();

  const {
    data: reelsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery({
    queryKey: ["reels"],
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === 10 ? allPages.length : undefined,
    queryFn: async ({ pageParam = 0 }) => {
      // Combine products and services for reels
      const [productsRes, servicesRes] = await Promise.all([
        supabase
          .from("products")
          .select("*, profiles(*)")
          .order("created_at", { ascending: false })
          .range(pageParam * 5, (pageParam + 1) * 5 - 1),
        supabase
          .from("services")
          .select("*, profiles(*)")
          .order("created_at", { ascending: false })
          .range(pageParam * 5, (pageParam + 1) * 5 - 1),
      ]);

      if (productsRes.error) throw productsRes.error;
      if (servicesRes.error) throw servicesRes.error;

      const products = (productsRes.data || []).map((item: any) => ({
        ...item,
        type: "product",
        media_url: item.img || item.image_url || item.media_urls?.[0],
        title: item.name || item.title,
        price: item.price,
        store_name: item.store_name || item.store,
        profile: item.profiles,
      }));

      const services = (servicesRes.data || []).map((item: any) => ({
        ...item,
        type: "service",
        media_url: item.img || item.image_url || item.media_urls?.[0],
        title: item.name || item.title,
        price: item.price,
        store_name: item.store_name || item.store,
        profile: item.profiles,
      }));

      // Interleave products and services
      const combined = [...products, ...services].sort(
        () => Math.random() - 0.5
      );

      return combined.slice(0, 10);
    },
  });

  const reels = reelsData?.pages.flat() || [];

  // Intersection Observer for video playback
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target as HTMLVideoElement;
          if (entry.isIntersecting) {
            video.play().catch(() => {
              // Autoplay blocked, handle gracefully
            });
          } else {
            video.pause();
          }
        });
      },
      {
        threshold: 0.7, // Play when 70% visible
        root: container,
      }
    );

    const videos = container.querySelectorAll("video");
    videos.forEach((video) => observer.observe(video));

    return () => observer.disconnect();
  }, [reels]);

  // Load more when near bottom
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
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const handleSave = (itemId: string) => {
    if (!user) {
      signInWithGoogle();
      return;
    }
    setSavedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const handleShare = async (item: any) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: item.title,
          text: `Vê este produto na MUSA: ${item.title}`,
          url: window.location.href,
        });
      } catch (err) {
        console.log("Share cancelled");
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const isVideo = (url: string) => {
    return /\.(mp4|webm|ogg|mov)$/i.test(url);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md text-center">
          <p className="text-sm text-muted-foreground">
            Não foi possível carregar os reels. Tenta novamente.
          </p>
        </div>
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md text-center">
          <h2 className="text-xl font-bold text-foreground">Ainda não há reels</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Em breve aparecerão vídeos e imagens de produtos aqui.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black">
      <div
        ref={containerRef}
        className="h-full overflow-y-scroll scroll-smooth snap-y snap-mandatory"
      >
        {reels.map((item: any, index) => (
          <div
            key={`${item.type}-${item.id}-${index}`}
            className="relative h-screen w-full snap-start"
          >
            {/* Media */}
            <div className="absolute inset-0 bg-muted">
              {item.media_url && isVideo(item.media_url) ? (
                <video
                  src={item.media_url}
                  className="size-full object-cover"
                  loop
                  playsInline
                  muted={muted}
                  preload="metadata"
                  poster={item.media_url.replace(/\.(mp4|webm|ogg|mov)$/i, ".jpg")}
                />
              ) : item.media_url ? (
                <img
                  src={item.media_url}
                  alt={item.title}
                  className="size-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="flex size-full items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                  <span className="text-4xl font-bold text-white/20">{item.title?.[0] || "?"}</span>
                </div>
              )}
            </div>

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            {/* Mute button */}
            <button
              onClick={() => setMuted(!muted)}
              className="absolute right-4 top-4 flex size-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition hover:bg-white/30"
            >
              {muted ? (
                <VolumeX className="size-5 text-white" />
              ) : (
                <Volume2 className="size-5 text-white" />
              )}
            </button>

            {/* Content - Bottom Left */}
            <div className="absolute bottom-20 left-4 right-20 max-w-md">
              <div className="flex items-center gap-3 mb-3">
                {item.profile?.avatar_url ? (
                  <img
                    src={item.profile.avatar_url}
                    alt={item.profile.full_name || item.store_name}
                    className="size-10 rounded-full border-2 border-white object-cover"
                  />
                ) : (
                  <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent">
                    <span className="text-sm font-bold text-white">
                      {(item.profile?.full_name || item.store_name || "M")?.[0]}
                    </span>
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-white">
                    {item.profile?.full_name || item.store_name || "Loja MUSA"}
                  </p>
                  <p className="text-xs text-white/70">
                    {item.profile?.business_name || ""}
                  </p>
                </div>
              </div>

              <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">
                {item.title}
              </h3>

              {item.price && (
                <p className="text-xl font-bold text-primary mb-3">
                  {typeof item.price === "number"
                    ? new Intl.NumberFormat("pt-AO", {
                        style: "currency",
                        currency: "AOA",
                        minimumFractionDigits: 0,
                      }).format(item.price)
                    : item.price}
                </p>
              )}

              <button
                onClick={() => setBuyModalItem(item)}
                className="rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-white shadow-lg transition hover:scale-105 active:scale-95"
              >
                Comprar
              </button>
            </div>

            {/* Actions - Right Side */}
            <div className="absolute right-4 bottom-24 flex flex-col gap-5">
              <button
                onClick={() => handleLike(item.id)}
                className="flex flex-col items-center gap-1 transition hover:scale-110 active:scale-95"
              >
                <div className="flex size-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                  <Heart
                    className={cn(
                      "size-6 transition-colors",
                      likedItems.has(item.id) ? "fill-[#FF5BA3] text-[#FF5BA3]" : "text-white"
                    )}
                  />
                </div>
                <span className="text-xs font-medium text-white">Like</span>
              </button>

              <button
                onClick={() => handleSave(item.id)}
                className="flex flex-col items-center gap-1 transition hover:scale-110 active:scale-95"
              >
                <div className="flex size-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                  <Bookmark
                    className={cn(
                      "size-6 transition-colors",
                      savedItems.has(item.id) ? "fill-[#FF5BA3] text-[#FF5BA3]" : "text-white"
                    )}
                  />
                </div>
                <span className="text-xs font-medium text-white">Guardar</span>
              </button>

              <button
                onClick={() => {
                  if (item.whatsapp || item.phone) {
                    const phone = item.whatsapp || item.phone;
                    window.open(`https://wa.me/${phone.replace(/\D/g, "")}`, "_blank");
                  }
                }}
                className="flex flex-col items-center gap-1 transition hover:scale-110 active:scale-95"
              >
                <div className="flex size-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                  <MessageCircle className="size-6 text-white" />
                </div>
                <span className="text-xs font-medium text-white">WhatsApp</span>
              </button>

              <button
                onClick={() => handleShare(item)}
                className="flex flex-col items-center gap-1 transition hover:scale-110 active:scale-95"
              >
                <div className="flex size-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                  <Share2 className="size-6 text-white" />
                </div>
                <span className="text-xs font-medium text-white">Partilhar</span>
              </button>
            </div>
          </div>
        ))}

        {/* Loading indicator at bottom */}
        {isFetchingNextPage && (
          <div className="flex h-24 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}
      </div>

      {/* Buy Modal */}
      <BuyModal
        open={!!buyModalItem}
        onClose={() => setBuyModalItem(null)}
        product={buyModalItem ? {
          name: buyModalItem.name || buyModalItem.title || "",
          price: buyModalItem.price || 0,
          category: buyModalItem.category || "",
          store: buyModalItem.store || buyModalItem.vendor_name || "",
          whatsapp: buyModalItem.whatsapp,
          vendor_phone: buyModalItem.vendor_phone,
          phone: buyModalItem.phone,
          variants: buyModalItem.variants || null,
        } : { name: "", price: 0, category: "", store: "" }}
      />
    </div>
  );
}