import { Home, LayoutGrid, Plus, Heart, User } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  onSellClick: () => void;
};

const items = [
  { label: "Início", Icon: Home, active: true },
  { label: "Categorias", Icon: LayoutGrid, active: false },
  { label: "Favoritos", Icon: Heart, active: false },
  { label: "Perfil", Icon: User, active: false },
];

export function BottomNav({ onSellClick }: Props) {
  return (
    <nav className="fixed bottom-0 left-0 z-40 flex w-full items-center justify-around border-t border-border-soft bg-card/90 px-2 pt-2.5 pb-6 backdrop-blur-xl lg:hidden">
      {items.slice(0, 2).map(({ label, Icon, active }) => (
        <NavItem key={label} label={label} Icon={Icon} active={active} />
      ))}

      <button
        onClick={onSellClick}
        className="relative -top-4 flex flex-1 flex-col items-center gap-0.5"
      >
        <span className="flex size-12 items-center justify-center rounded-full border-4 border-background bg-primary shadow-neon-lg">
          <Plus className="size-5 text-primary-foreground" strokeWidth={2} />
        </span>
        <span className="text-[9px] font-semibold text-primary">Vender</span>
      </button>

      {items.slice(2).map(({ label, Icon, active }) => (
        <NavItem key={label} label={label} Icon={Icon} active={active} />
      ))}
    </nav>
  );
}

function NavItem({
  label,
  Icon,
  active,
}: {
  label: string;
  Icon: typeof Home;
  active: boolean;
}) {
  return (
    <button className="flex flex-1 flex-col items-center gap-1">
      <Icon
        className={cn("size-[19px]", active ? "text-primary" : "text-muted-soft")}
        strokeWidth={1.8}
      />
      <span
        className={cn(
          "text-[9px] font-semibold",
          active ? "text-primary" : "text-muted-soft",
        )}
      >
        {label}
      </span>
    </button>
  );
}
