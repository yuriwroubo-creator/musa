import { Star, Check, MapPin, Heart, Play, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Product, Service, Vendor } from "@/lib/musa-data";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuth } from "@/hooks/useAuth";
import { useFollows } from "@/hooks/useFollows";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAudio } from "@/lib/AudioContext";
import { PlaceholderArt } from "@/components/musa/PlaceholderArt";
import { DetailModal } from "./DetailModal";

function formatPrice(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return `${value.toLocaleString("pt-AO")} Kz`;
  }
  if (typeof value === "string" && value.trim()) return value;
  return "Preço sob consulta";
}

export function ProductCard({
  product,
  onBuy,
  onDetails,
}: {
  product: Product & { vendor_id?: string | null; description?: string | null; variants?: any[] | null };
  onBuy: () => void;
  onDetails: () => void;
}) {
  const { checkIsFavorite, toggleFavorite } = useFavorites();
  const { signInWithGoogle, user } = useAuth();
  const { play, currentTrack, isPlaying, pause } = useAudio();
  const { checkIsFollowing, toggleFollow } = useFollows();

  const isFavorite = checkIsFavorite(product.id);
  const isFollowing = product.vendor_id ? checkIsFollowing(product.vendor_id) : false;
  const audioUrl = product.media_urls?.find((url) => url.match(/\.(mp3|wav|aac|ogg)$/i));
  const imageUrl =
    product.img || product.media_urls?.find((u) => u.match(/\.(jpg|jpeg|png|webp)$/i));
  const isThisAudioPlaying = currentTrack === audioUrl && isPlaying;

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      signInWithGoogle();
      return;
    }
    toggleFavorite.mutate({ itemId: product.id, itemType: "product", isFavorite });
  };

  const handleFollowClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!product.vendor_id) return;
    if (!user) {
      signInWithGoogle();
      return;
    }
    toggleFollow.mutate({ followingId: product.vendor_id, isFollowing });
  };

  return (
    <article className="group luxe-card animate-rise flex flex-col overflow-hidden rounded-[22px] transition-all duration-300 hover:-translate-y-1 hover:shadow-luxe">
      <div className="relative aspect-[1/1.18] w-full overflow-hidden bg-muted">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name}
            loading="lazy"
            className="size-full object-cover transition-transform duration-700 group-hover:scale-[1.07]"
          />
        ) : (
          <PlaceholderArt title={product.name} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/48 via-transparent to-black/14 opacity-80" />
        {audioUrl && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              if (isThisAudioPlaying) pause();
              else
                play(audioUrl, {
                  title: product.name,
                  creator: product.store,
                  artwork: product.img,
                  subtitle: product.category,
                });
            }}
            className={cn(
              "absolute inset-0 flex items-center justify-center bg-black/10 transition-colors hover:bg-black/20",
              isThisAudioPlaying && "bg-black/25",
            )}
          >
            <div
              className={cn(
                "flex size-11 items-center justify-center rounded-full backdrop-blur-md transition-all shadow-neon",
                isThisAudioPlaying
                  ? "bg-primary text-white shadow-neon-lg animate-pulse"
                  : "bg-white/85 text-primary",
              )}
            >
              <Play
                fill="currentColor"
                className={cn("size-[18px]", !isThisAudioPlaying && "ml-0.5")}
              />
            </div>
          </button>
        )}
        <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-white/88 px-2 py-1 text-[10px] font-bold text-foreground backdrop-blur-sm">
          <Star className="size-2.5 fill-primary text-primary" />
          {product.rating}
        </span>
        <button
          onClick={handleFavoriteClick}
          disabled={toggleFavorite.isPending}
          aria-label="Adicionar aos favoritos"
          className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-white/12 text-white shadow-sm backdrop-blur-sm transition-all hover:scale-105 active:scale-90"
        >
          <Heart
            className={cn(
              "size-3.5 transition-colors",
              isFavorite ? "fill-[#FF5BA3] text-[#FF5BA3]" : "text-white/80",
            )}
          />
        </button>
        {product.vendor_id && (
          <button
            onClick={handleFollowClick}
            disabled={toggleFollow.isPending}
            aria-label="Seguir a loja"
            className={cn(
              "absolute left-2 top-11 flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold backdrop-blur-sm transition-all",
              isFollowing
                ? "bg-gradient-to-r from-[#FF2D78] to-[#FF5BA3] text-white shadow-[0_4px_16px_rgba(255,45,120,.3)]"
                : "bg-white/12 text-white/80 shadow-sm hover:scale-[1.02]",
            )}
          >
            {isFollowing ? "A seguir" : "Seguir"}
          </button>
        )}
        <span className="absolute bottom-2 left-2 rounded-full bg-white/16 px-2.5 py-1 text-[9.5px] font-bold text-white backdrop-blur-md">
          {product.category}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 px-4 pb-4 pt-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/50">
          {(product as any).store_name || product.store || "Loja MUSA"}
        </p>
        <h3 className="min-h-[36px] text-[15px] font-bold leading-snug text-white">
          {(product as any).title || product.name}
        </h3>
        <div className="mt-1 flex items-center justify-between gap-2">
          <p className="font-mono text-[13px] font-bold text-[#FF5BA3]">
            {formatPrice(product.price)}
          </p>
        </div>
        <div className="mt-auto">
          {product.variants && product.variants.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onBuy}
                className="sheen rounded-xl bg-gradient-to-r from-[#FF2D78] to-[#FF5BA3] py-2.5 text-[11.5px] font-bold tracking-wide text-white shadow-[0_8px_24px_rgba(255,45,120,.35)] transition-all hover:shadow-[0_12px_32px_rgba(255,45,120,.5)] hover:-translate-y-0.5 active:scale-95"
              >
                Opções
              </button>
              <button
                onClick={onDetails}
                className="rounded-xl border border-white/10 bg-white/8 py-2.5 text-[11.5px] font-bold tracking-wide text-white/90 transition-all hover:border-white/20 hover:bg-white/12 active:scale-95"
              >
                Ver mais
              </button>
            </div>
          ) : (
            <button
              onClick={onBuy}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FF2D78] to-[#FF5BA3] py-3 text-[11.5px] font-bold tracking-wide text-white shadow-[0_8px_24px_rgba(255,45,120,.35)] transition-all hover:shadow-[0_12px_32px_rgba(255,45,120,.5)] hover:-translate-y-0.5 active:scale-95"
            >
              <MessageCircle className="size-4" />
              Comprar via WhatsApp
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export function ServiceCard({
  service,
  onBook,
  onDetails,
}: {
  service: Service & { vendor_id?: string | null; description?: string | null; variants?: any[] | null };
  onBook: () => void;
  onDetails: () => void;
}) {
  const { checkIsFavorite, toggleFavorite } = useFavorites();
  const { signInWithGoogle, user } = useAuth();
  const { checkIsFollowing, toggleFollow } = useFollows();

  const isFavorite = checkIsFavorite(service.id);
  const isFollowing = service.vendor_id ? checkIsFollowing(service.vendor_id) : false;
  const imageUrl =
    service.img || service.media_urls?.find((u) => u.match(/\.(jpg|jpeg|png|webp)$/i));

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      signInWithGoogle();
      return;
    }
    toggleFavorite.mutate({ itemId: service.id, itemType: "service", isFavorite });
  };

  const handleFollowClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!service.vendor_id) return;
    if (!user) {
      signInWithGoogle();
      return;
    }
    toggleFollow.mutate({ followingId: service.vendor_id, isFollowing });
  };

  return (
    <article className="luxe-card animate-rise flex items-center gap-3 rounded-[22px] p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-luxe bg-gradient-to-br from-white/5 to-white/10 border border-white/10">
      <div className="relative shrink-0">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={service.name}
            loading="lazy"
            className="size-[78px] rounded-[16px] object-cover lg:size-[92px]"
          />
        ) : (
          <PlaceholderArt
            title={service.name}
            kind="service"
            className="size-[78px] rounded-[16px] lg:size-[92px]"
          />
        )}
        <span className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full border-2 border-card bg-primary">
          <Check className="size-2.5 text-primary-foreground" strokeWidth={3} />
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <h3 className="truncate text-[13px] font-bold lg:text-sm text-white">{service.name}</h3>
          <span className="flex shrink-0 items-center gap-0.5 text-[10px] font-bold text-white/70">
            <Star className="size-2.5 fill-[#FF5BA3] text-[#FF5BA3]" />
            {service.rating}
          </span>
        </div>
        <p className="mt-0.5 line-clamp-1 text-xs text-white/60">{service.title}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <span className="font-mono text-[12px] font-bold text-[#FF5BA3]">
            {formatPrice(service.price)}
          </span>
          <span
            className={cn(
              "flex items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-bold",
              service.home
                ? "bg-white/10 text-white/80"
                : "bg-white/5 text-white/60",
            )}
          >
            <MapPin className="size-2.5" />
            {service.home ? "Ao domicílio" : "Em estúdio"}
          </span>
        </div>
      </div>
      <div className="flex h-[78px] shrink-0 flex-col items-end gap-2 lg:h-[92px]">
        <button
          onClick={handleFavoriteClick}
          disabled={toggleFavorite.isPending}
          aria-label="Adicionar aos favoritos"
          className="flex size-7 items-center justify-center rounded-full transition-all active:scale-90 hover:bg-white/10"
        >
          <Heart
            className={cn(
              "size-4 transition-colors",
              isFavorite ? "fill-[#FF5BA3] text-[#FF5BA3]" : "text-white/60",
            )}
          />
        </button>
        {service.vendor_id && (
          <button
            onClick={handleFollowClick}
            disabled={toggleFollow.isPending}
            className={cn(
              "rounded-full px-2.5 py-1 text-[9.5px] font-bold transition-all",
              isFollowing
                ? "bg-gradient-to-r from-[#FF2D78] to-[#FF5BA3] text-white shadow-[0_4px_16px_rgba(255,45,120,.3)]"
                : "bg-white/10 text-white/70 hover:text-white",
            )}
          >
            {isFollowing ? "A seguir" : "Seguir"}
          </button>
        )}
        <div className="mt-auto">
          {service.variants && service.variants.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onBook}
                className="sheen rounded-xl bg-gradient-to-r from-[#FF2D78] to-[#FF5BA3] px-4 py-2 text-[11px] font-bold text-white shadow-[0_8px_24px_rgba(255,45,120,.35)] transition-all hover:shadow-[0_12px_32px_rgba(255,45,120,.5)] hover:-translate-y-0.5 active:scale-95"
              >
                Opções
              </button>
              <button
                onClick={onDetails}
                className="rounded-xl border border-white/10 bg-white/8 px-4 py-2 text-[11px] font-bold text-white/90 transition-all hover:border-white/20 hover:bg-white/12 active:scale-95"
              >
                Ver mais
              </button>
            </div>
          ) : (
            <button
              onClick={onBook}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FF2D78] to-[#FF5BA3] px-4 py-2 text-[11px] font-bold text-white shadow-[0_8px_24px_rgba(255,45,120,.35)] transition-all hover:shadow-[0_12px_32px_rgba(255,45,120,.5)] hover:-translate-y-0.5 active:scale-95"
            >
              <MessageCircle className="size-4" />
              Agendar via WhatsApp
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export function VendorCard({ vendor }: { vendor: Vendor & { store_photo_url?: string | null } }) {
  const { checkIsFollowing, toggleFollow } = useFollows();
  const { signInWithGoogle, user } = useAuth();
  const isFollowing = checkIsFollowing(vendor.id);

  const { data: followerCount = 0 } = useQuery({
    queryKey: ["vendor_followers", vendor.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", vendor.id);
      if (error) {
        console.error("Error fetching followers:", error);
        return 0;
      }
      return count || 0;
    },
  });

  const handleFollowClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      signInWithGoogle();
      return;
    }
    toggleFollow.mutate({ followingId: vendor.id, isFollowing });
  };

  return (
    <article className="luxe-card animate-rise flex flex-col items-center gap-2 rounded-[22px] px-4 py-5 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-luxe bg-gradient-to-br from-white/5 to-white/10 border border-white/10">
      <div className="relative">
        {vendor.img || vendor.store_photo_url ? (
          <img
            src={vendor.img || vendor.store_photo_url || ""}
            alt={vendor.name}
            loading="lazy"
            className="size-[64px] rounded-full border-[3px] border-accent object-cover shadow-soft lg:size-[72px]"
          />
        ) : (
          <div className="flex size-[64px] items-center justify-center rounded-full border-[3px] border-accent bg-secondary text-[10px] font-black uppercase tracking-[0.08em] text-muted-foreground shadow-soft lg:size-[72px]">
            MUSA
          </div>
        )}
        <span className="absolute -right-0.5 -bottom-0.5 flex size-5 items-center justify-center rounded-full border-2 border-card bg-primary">
          <Check className="size-2.5 text-primary-foreground" strokeWidth={3} />
        </span>
      </div>
      <div>
        <h3 className="text-[12.5px] font-bold text-white">{vendor.name}</h3>
        <p className="text-[10.5px] text-white/60">{vendor.cat}</p>
        <p className="mt-0.5 text-[10px] text-white/50">
          {followerCount} {followerCount === 1 ? "seguidora" : "seguidoras"}
        </p>
      </div>
      <button
        onClick={handleFollowClick}
        disabled={toggleFollow.isPending}
        className={cn(
          "mt-1 w-full rounded-full py-1.5 text-[10.5px] font-bold transition-all disabled:opacity-70",
          isFollowing
            ? "bg-gradient-to-r from-[#FF2D78] to-[#FF5BA3] text-white shadow-[0_4px_16px_rgba(255,45,120,.3)]"
            : "border border-white/20 text-white/70 hover:bg-white/10 hover:text-white",
        )}
      >
        {isFollowing ? "A seguir ✓" : "Seguir"}
      </button>
    </article>
  );
}
