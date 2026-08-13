import { Star, Check, MapPin, Heart, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Product, Service, Vendor } from "@/lib/musa-data";
import { useState } from "react";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuth } from "@/hooks/useAuth";
import { useFollows } from "@/hooks/useFollows";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAudio } from "@/lib/AudioContext";

export function ProductCard({ product, onBuy }: { product: Product; onBuy: () => void }) {
  const { checkIsFavorite, toggleFavorite } = useFavorites();
  const { signInWithGoogle, user } = useAuth();
  const { play, currentTrack, isPlaying, pause } = useAudio();

  const isFavorite = checkIsFavorite(product.id);
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
          <div className="flex size-full items-center justify-center bg-secondary text-[11px] font-black uppercase tracking-[0.08em] text-muted-foreground">
            MUSA
          </div>
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
        {/* Rating badge */}
        <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-white/88 px-2 py-1 text-[10px] font-bold text-foreground backdrop-blur-sm">
          <Star className="size-2.5 fill-primary text-primary" />
          {product.rating}
        </span>
        {/* Wishlist button */}
        <button
          onClick={handleFavoriteClick}
          disabled={toggleFavorite.isPending}
          aria-label="Adicionar aos favoritos"
          className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-white/82 text-foreground shadow-sm backdrop-blur-sm transition-all hover:scale-105 active:scale-90"
        >
          <Heart
            className={cn(
              "size-3.5 transition-colors",
              isFavorite ? "fill-primary text-primary" : "text-muted-foreground",
            )}
          />
        </button>
        {/* Category badge */}
        <span className="absolute bottom-2 left-2 rounded-full bg-white/16 px-2.5 py-1 text-[9.5px] font-bold text-white backdrop-blur-md">
          {product.category}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1 px-3.5 pb-3.5 pt-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
          {product.store}
        </p>
        <h3 className="min-h-[36px] text-[13px] font-bold leading-snug lg:text-sm">
          {product.name}
        </h3>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <p className="font-mono text-[12.5px] font-bold text-primary">{product.price}</p>
          <span className="rounded-full bg-accent px-2 py-0.5 text-[9px] font-bold text-accent-foreground">
            Trend
          </span>
        </div>
        <button
          onClick={onBuy}
          className="sheen mt-auto w-full rounded-xl bg-foreground py-2.5 text-[11.5px] font-bold tracking-wide text-background shadow-soft transition-all hover:bg-primary hover:text-primary-foreground active:scale-95"
        >
          Comprar
        </button>
      </div>
    </article>
  );
}

export function ServiceCard({ service, onBook }: { service: Service; onBook: () => void }) {
  const { checkIsFavorite, toggleFavorite } = useFavorites();
  const { signInWithGoogle, user } = useAuth();

  const isFavorite = checkIsFavorite(service.id);
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

  return (
    <article className="luxe-card animate-rise flex items-center gap-3 rounded-[22px] p-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-luxe">
      <div className="relative shrink-0">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={service.name}
            loading="lazy"
            className="size-[78px] rounded-[16px] object-cover lg:size-[92px]"
          />
        ) : (
          <div className="flex size-[78px] items-center justify-center rounded-[16px] bg-secondary text-[10px] font-black uppercase tracking-[0.08em] text-muted-foreground lg:size-[92px]">
            MUSA
          </div>
        )}
        <span className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full border-2 border-card bg-primary">
          <Check className="size-2.5 text-primary-foreground" strokeWidth={3} />
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <h3 className="truncate text-[13px] font-bold lg:text-sm">{service.name}</h3>
          <span className="flex shrink-0 items-center gap-0.5 text-[10px] font-bold text-muted-foreground">
            <Star className="size-2.5 fill-primary text-primary" />
            {service.rating}
          </span>
        </div>
        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{service.title}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <span className="font-mono text-[12px] font-bold text-primary">{service.price}</span>
          <span
            className={cn(
              "flex items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-bold",
              service.home
                ? "bg-accent text-accent-foreground"
                : "bg-secondary text-muted-foreground",
            )}
          >
            <MapPin className="size-2.5" />
            {service.home ? "Ao domicílio" : "Em estúdio"}
          </span>
        </div>
      </div>
      <div className="flex h-[78px] shrink-0 flex-col items-end justify-between lg:h-[92px]">
        <button
          onClick={handleFavoriteClick}
          disabled={toggleFavorite.isPending}
          aria-label="Adicionar aos favoritos"
          className="flex size-7 items-center justify-center rounded-full transition-all active:scale-90 hover:bg-secondary"
        >
          <Heart
            className={cn(
              "size-4 transition-colors",
              isFavorite ? "fill-primary text-primary" : "text-muted-foreground",
            )}
          />
        </button>
        <button
          onClick={onBook}
          className="sheen rounded-xl bg-primary px-4 py-2 text-[11px] font-bold text-primary-foreground shadow-neon transition-all hover:shadow-neon-lg active:scale-95"
        >
          Agendar
        </button>
      </div>
    </article>
  );
}

export function VendorCard({ vendor }: { vendor: Vendor }) {
  const { checkIsFollowing, toggleFollow } = useFollows();
  const { signInWithGoogle, user } = useAuth();
  const isFollowing = checkIsFollowing(vendor.id);

  // Fetch follower count
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
    <article className="luxe-card animate-rise flex flex-col items-center gap-2 rounded-[22px] px-3 py-5 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-luxe">
      <div className="relative">
        {vendor.img ? (
          <img
            src={vendor.img}
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
        <h3 className="text-[12.5px] font-bold">{vendor.name}</h3>
        <p className="text-[10.5px] text-muted-foreground">{vendor.cat}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {followerCount} {followerCount === 1 ? "seguidora" : "seguidoras"}
        </p>
      </div>
      <button
        onClick={handleFollowClick}
        disabled={toggleFollow.isPending}
        className={cn(
          "mt-1 w-full rounded-full py-1.5 text-[10.5px] font-bold transition-all disabled:opacity-70",
          isFollowing
            ? "bg-primary text-primary-foreground shadow-neon"
            : "border border-foreground hover:bg-foreground hover:text-background",
        )}
      >
        {isFollowing ? "A seguir ✓" : "Seguir"}
      </button>
    </article>
  );
}
