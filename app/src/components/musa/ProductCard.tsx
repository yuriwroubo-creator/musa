import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Heart, Star } from "lucide-react";
import { formatKz, type MusaItem } from "@/lib/musa-data";
import { cn } from "@/lib/utils";

export function ProductCard({
  item,
  favorite,
  onToggleFavorite,
  index = 0,
}: {
  item: MusaItem;
  favorite: boolean;
  onToggleFavorite: (id: string) => void;
  index?: number;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.3) }}
      className="luxe-card relative"
    >
      <Link
        to="/loja/$storeId"
        params={{ storeId: item.storeId }}
        className="block"
      >
        <div className="relative aspect-[4/5] overflow-hidden bg-muted">
          <img
            src={item.image}
            alt={item.title}
            loading="lazy"
            width={768}
            height={1024}
            className="h-full w-full object-cover"
          />
          {item.premium && (
            <span className="absolute left-2 top-2 rounded-full bg-gold/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-foreground">
              Premium
            </span>
          )}
          <span
            className={cn(
              "absolute bottom-2 left-2 rounded-full px-2 py-0.5 text-[10px] font-semibold backdrop-blur-sm",
              item.kind === "servico"
                ? "bg-accent/90 text-accent-foreground"
                : "bg-card/85 text-muted-foreground",
            )}
          >
            {item.kind === "servico" ? "Serviço" : "Produto"}
          </span>
        </div>
        <div className="space-y-1 p-2.5">
          <h3 className="line-clamp-2 text-[13px] font-semibold leading-snug">
            {item.title}
          </h3>
          <p className="text-sm font-extrabold text-primary">
            {formatKz(item.price)}
          </p>
          <div className="flex min-w-0 items-center gap-1 text-[11px] text-muted-foreground">
            <Star className="h-3 w-3 shrink-0 fill-gold text-gold" />
            <span className="shrink-0 font-semibold">{item.rating}</span>
            <span className="truncate">· {item.storeName}</span>
          </div>
        </div>
      </Link>
      <button
        type="button"
        aria-label={favorite ? "Remover dos favoritos" : "Guardar nos favoritos"}
        onClick={() => onToggleFavorite(item.id)}
        className="absolute right-1 top-1 flex min-h-[44px] min-w-[44px] items-center justify-center"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-card/80 backdrop-blur-sm transition-transform active:scale-90">
          <Heart
            className={cn(
              "h-[18px] w-[18px]",
              favorite ? "fill-primary text-primary" : "text-muted-foreground",
            )}
          />
        </span>
      </button>
    </motion.article>
  );
}
