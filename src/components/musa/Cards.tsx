import { Star, Check, MapPin, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Product, Service, Vendor } from "@/lib/musa-data";
import { useState } from "react";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuth } from "@/hooks/useAuth";
import { useFollows } from "@/hooks/useFollows";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function ProductCard({
  product,
  onBuy,
}: {
  product: Product;
  onBuy: () => void;
}) {
  const { checkIsFavorite, toggleFavorite } = useFavorites();
  const { signInWithGoogle, user } = useAuth();
  
  const isFavorite = checkIsFavorite(product.id);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      signInWithGoogle();
      return;
    }
    toggleFavorite.mutate({ itemId: product.id, itemType: "product", isFavorite });
  };

  return (
    <article className="group flex flex-col overflow-hidden rounded-[18px] border border-border-soft bg-card transition-all duration-300 hover:shadow-soft hover:-translate-y-0.5">
      <div className="relative aspect-[1/1.15] w-full overflow-hidden">
        <img
          src={product.img}
          alt={product.name}
          loading="lazy"
          className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
        />
        {/* Rating badge */}
        <span className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-card/90 px-2 py-0.5 text-[10px] font-bold backdrop-blur-sm">
          <Star className="size-2.5 fill-primary text-primary" />
          {product.rating}
        </span>
        {/* Wishlist button */}
        <button
          onClick={handleFavoriteClick}
          disabled={toggleFavorite.isPending}
          aria-label="Adicionar aos favoritos"
          className="absolute top-2 right-2 flex size-7 items-center justify-center rounded-full bg-card/80 backdrop-blur-sm transition-all active:scale-90"
        >
          <Heart
            className={cn("size-3.5 transition-colors", isFavorite ? "fill-primary text-primary" : "text-muted-foreground")}
          />
        </button>
        {/* Category badge */}
        <span className="absolute bottom-2 left-2 rounded-full bg-foreground/70 px-2 py-0.5 text-[9px] font-semibold text-background backdrop-blur-sm">
          {product.category}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-0.5 px-3 pt-2.5 pb-3">
        <p className="text-[10px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">
          {product.store}
        </p>
        <h3 className="text-[13px] leading-snug font-semibold lg:text-sm">{product.name}</h3>
        <p className="mt-0.5 font-mono text-[12.5px] text-primary font-bold">{product.price}</p>
        <button
          onClick={onBuy}
          className="mt-auto w-full rounded-xl bg-primary py-2.5 text-[11.5px] font-bold tracking-wide text-primary-foreground shadow-neon transition-all active:scale-95 hover:shadow-neon-lg"
        >
          Comprar
        </button>
      </div>
    </article>
  );
}

export function ServiceCard({
  service,
  onBook,
}: {
  service: Service;
  onBook: () => void;
}) {
  const { checkIsFavorite, toggleFavorite } = useFavorites();
  const { signInWithGoogle, user } = useAuth();
  
  const isFavorite = checkIsFavorite(service.id);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      signInWithGoogle();
      return;
    }
    toggleFavorite.mutate({ itemId: service.id, itemType: "service", isFavorite });
  };

  return (
    <article className="flex items-center gap-3 rounded-[18px] border border-border-soft bg-card p-3 transition-all duration-300 hover:shadow-soft hover:-translate-y-0.5">
      <div className="relative shrink-0">
        <img
          src={service.img}
          alt={service.name}
          loading="lazy"
          className="size-[72px] rounded-[14px] object-cover lg:size-[80px]"
        />
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
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{service.title}</p>
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
      <div className="flex flex-col items-end justify-between shrink-0 h-[72px] lg:h-[80px]">
        <button
          onClick={handleFavoriteClick}
          disabled={toggleFavorite.isPending}
          aria-label="Adicionar aos favoritos"
          className="flex size-7 items-center justify-center rounded-full transition-all active:scale-90 hover:bg-secondary"
        >
          <Heart
            className={cn("size-4 transition-colors", isFavorite ? "fill-primary text-primary" : "text-muted-foreground")}
          />
        </button>
        <button
          onClick={onBook}
          className="rounded-xl bg-primary px-4 py-2 text-[11px] font-bold text-primary-foreground shadow-neon transition-all active:scale-95 hover:shadow-neon-lg"
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
      if (vendor.id.startsWith("v")) return 0; // Fallback for local dev mocks
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
    <article className="flex flex-col items-center gap-2 rounded-[18px] border border-border-soft bg-card px-3 py-5 text-center transition-all duration-300 hover:shadow-soft hover:-translate-y-0.5">
      <div className="relative">
        <img
          src={vendor.img}
          alt={vendor.name}
          loading="lazy"
          className="size-[60px] rounded-full border-2 border-accent object-cover lg:size-[68px]"
        />
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
