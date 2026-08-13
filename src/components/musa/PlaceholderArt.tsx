import { Package, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function PlaceholderArt({
  title = "MUSA",
  kind = "product",
  className,
}: {
  title?: string;
  kind?: "product" | "service";
  className?: string;
}) {
  const initials = title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  return (
    <div
      className={cn(
        "relative flex size-full overflow-hidden bg-[linear-gradient(135deg,var(--color-primary-wash),var(--color-card)_44%,var(--color-accent))]",
        className,
      )}
    >
      <div className="absolute inset-0 opacity-70 [background-image:linear-gradient(120deg,transparent_0_34%,color-mix(in_oklch,var(--color-primary),white_30%)/.18_34%_36%,transparent_36%_100%)]" />
      <div className="absolute -right-8 -top-8 size-24 rounded-full border border-primary/20" />
      <div className="absolute -bottom-10 -left-8 size-28 rounded-full border border-[color:var(--jade)]/20" />
      <div className="relative m-auto flex flex-col items-center gap-2 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-card/78 text-primary shadow-soft backdrop-blur">
          {kind === "service" ? <Sparkles className="size-5" /> : <Package className="size-5" />}
        </span>
        <span className="font-serif text-2xl font-semibold italic text-foreground">
          {initials || "M"}
        </span>
      </div>
    </div>
  );
}
