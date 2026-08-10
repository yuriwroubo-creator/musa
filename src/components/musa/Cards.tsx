import { Star, Check, MapPin, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Product, Service, Vendor } from "@/lib/musa-data";
import { useState } from "react";

export function ProductCard({
  product,
  onBuy,
}: {
  product: Product;
  onBuy: () => void;
}) {
  const [liked, setLiked] = useState(false);

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
          onClick={(e) => { e.stopPropagation(); setLiked((v) => !v); }}
          aria-label="Adicionar aos favoritos"
          className="absolute top-2 right-2 flex size-7 items-center justify-center rounded-full bg-card/80 backdrop-blur-sm transition-all active:scale-90"
        >
          <Heart
            className={cn("size-3.5 transition-colors", liked ? "fill-primary text-primary" : "text-muted-foreground")}
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
      <button
        onClick={onBook}
        className="shrink-0 rounded-xl bg-primary px-4 py-2 text-[11px] font-bold text-primary-foreground shadow-neon transition-all active:scale-95 hover:shadow-neon-lg"
      >
        Agendar
      </button>
    </article>
  );
}

export function VendorCard({ vendor }: { vendor: Vendor }) {
  const [following, setFollowing] = useState(false);

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
      </div>
      <button
        onClick={() => setFollowing((v) => !v)}
        className={cn(
          "mt-0.5 w-full rounded-full py-1.5 text-[10.5px] font-bold transition-all",
          following
            ? "bg-primary text-primary-foreground shadow-neon"
            : "border border-foreground hover:bg-foreground hover:text-background",
        )}
      >
        {following ? "A seguir ✓" : "Seguir"}
      </button>
    </article>
  );
}
