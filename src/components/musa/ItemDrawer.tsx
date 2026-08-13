import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReviewSection } from "./ReviewSection";

export type DrawerItem = {
  kind: "product" | "service";
  img: string;
  title: string;
  price: string;
  vendor_id?: string;
};

const sizes = ["S", "M", "L", "XL"];
const colors = ["Nude", "Preto", "Rosa"];
const dates = ["Qui, 14", "Sex, 15", "Sáb, 16"];
const times = ["09:00", "11:30", "15:00", "17:30"];

export function ItemDrawer({
  item,
  onClose,
  onConfirm,
}: {
  item: DrawerItem | null;
  onClose: () => void;
  onConfirm: (item: DrawerItem) => void;
}) {
  const open = item !== null;
  const [optA, setOptA] = useState(0);
  const [optB, setOptB] = useState(0);

  useEffect(() => {
    if (open) {
      setOptA(0);
      setOptB(0);
    }
  }, [open, item?.title]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const isProduct = item?.kind === "product";
  const rowA = isProduct ? sizes : dates;
  const rowB = isProduct ? colors : times;

  return (
    <>
      <div
        onClick={onClose}
        aria-hidden={!open}
        className={cn(
          "fixed inset-0 z-80 bg-foreground/45 backdrop-blur-[2px] transition-opacity duration-300",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Detalhes do item"
        className={cn(
          "fixed bottom-0 left-1/2 z-90 max-h-[85vh] w-full max-w-[520px] -translate-x-1/2 overflow-y-auto rounded-t-[26px] bg-card px-6 pt-3 pb-8 transition-transform duration-[380ms] ease-[cubic-bezier(.2,.8,.2,1)] sm:bottom-6 sm:rounded-[26px]",
          open ? "translate-y-0" : "translate-y-full",
        )}
      >
        <div className="mx-auto mt-1.5 mb-3.5 h-1 w-9 rounded-full bg-border sm:hidden" />
        <button
          onClick={onClose}
          aria-label="Fechar"
          className="absolute top-4 right-4 hidden size-8 items-center justify-center rounded-full bg-secondary sm:flex"
        >
          <X className="size-4" />
        </button>

        <div className="flex items-center gap-3 border-b border-border-soft pb-3.5">
          {item ? (
            <img
              src={item.img}
              alt={item.title}
              className="size-13 rounded-xl object-cover"
              style={{ width: 52, height: 52 }}
            />
          ) : null}
          <div>
            <p className="text-sm font-bold">{item?.title ?? "—"}</p>
            <p className="mt-0.5 font-mono text-xs text-primary-deep">{item?.price ?? "—"}</p>
          </div>
        </div>

        <Label>{isProduct ? "Tamanho" : "Data"}</Label>
        <Swatches options={rowA} selected={optA} onSelect={setOptA} />
        <Label>{isProduct ? "Cor" : "Horário"}</Label>
        <Swatches options={rowB} selected={optB} onSelect={setOptB} />

        <button
          onClick={() => item && onConfirm(item)}
          className="mt-6 w-full rounded-2xl bg-primary py-3.5 text-[13px] font-bold text-primary-foreground shadow-neon-lg transition-transform active:scale-[0.98]"
        >
          {isProduct ? "Adicionar ao Carrinho" : "Confirmar Agendamento"}
        </button>

        {item?.vendor_id && (
          <div className="mt-8 border-t border-border-soft pt-4">
            <ReviewSection vendorId={item.vendor_id} />
          </div>
        )}
      </div>
    </>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-5 mb-2.5 text-[11px] font-bold tracking-[0.05em] text-muted-foreground uppercase">
      {children}
    </p>
  );
}

function Swatches({
  options,
  selected,
  onSelect,
}: {
  options: string[];
  selected: number;
  onSelect: (i: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {options.map((o, i) => (
        <button
          key={o}
          onClick={() => onSelect(i)}
          aria-pressed={selected === i}
          className={cn(
            "rounded-xl border px-4 py-2.5 text-xs font-semibold transition-colors",
            selected === i
              ? "border-primary bg-accent text-accent-foreground"
              : "border-border text-foreground hover:border-primary/40",
          )}
        >
          {o}
        </button>
      ))}
    </div>
  );
}
