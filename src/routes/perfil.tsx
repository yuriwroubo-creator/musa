/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  BarChart3,
  Bell,
  Grid3X3,
  Heart,
  LogOut,
  Package,
  Plus,
  Settings,
  Store,
  User as UserIcon,
  Users,
  Eye,
} from "lucide-react";
import { SiteHeader } from "@/components/musa/SiteHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { useSellModal } from "@/lib/SellContext";
import { useVendorStats } from "@/hooks/useVendorStats";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/perfil")({
  component: ProfilePage,
});

type ProfileTab = "publicacoes" | "atividade" | "estatisticas";

function ProfilePage() {
  const { user, loading, signOut } = useAuth();
  const { setSellOpen } = useSellModal();
  const navigate = useNavigate();
  const [tab, setTab] = useState<ProfileTab>("publicacoes");
  const stats = useVendorStats();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/", replace: true });
  }, [user, loading, navigate]);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
  });

  if (loading || !user) {
    return <div className="flex min-h-screen items-center justify-center">A carregar...</div>;
  }

  const fullName = profile?.full_name || user.user_metadata?.full_name || "Criadora MUSA";
  const avatarUrl = profile?.avatar_url || user.user_metadata?.avatar_url;

  const handleLogout = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      <SiteHeader
        query=""
        onQueryChange={() => {}}
        cartCount={0}
        onCartClick={() => {}}
        onSellClick={() => setSellOpen(true)}
      />

      <main className="mx-auto w-full max-w-5xl px-5 pt-5 lg:px-8 lg:pt-8">
        <section className="overflow-hidden rounded-[28px] bg-foreground text-background shadow-luxe">
          <div className="h-32 bg-gradient-to-br from-primary via-[#171014] to-[color:var(--jade)] lg:h-44" />
          <div className="px-5 pb-6 sm:px-7">
            <div className="-mt-12 flex items-end justify-between gap-4">
              <div className="flex items-end gap-4">
                <div className="flex size-24 items-center justify-center overflow-hidden rounded-full border-4 border-background bg-card text-foreground shadow-luxe lg:size-32">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={fullName} className="size-full object-cover" />
                  ) : (
                    <UserIcon className="size-9" />
                  )}
                </div>
                <div className="pb-2">
                  <h1 className="max-w-[15rem] truncate text-xl font-black text-white lg:text-3xl">
                    {fullName}
                  </h1>
                  <p className="mt-1 text-xs font-medium text-white/62">{user.email}</p>
                </div>
              </div>
              <button
                aria-label="Definições"
                className="mb-2 flex size-10 items-center justify-center rounded-full bg-white/12 text-white backdrop-blur"
              >
                <Settings className="size-5" />
              </button>
            </div>

            <div className="mt-5 grid grid-cols-4 gap-2 rounded-2xl bg-white/8 p-2 text-center backdrop-blur">
              <ProfileMetric
                label="Posts"
                value={stats.totalListings}
                icon={<Package className="size-4" />}
              />
              <ProfileMetric
                label="Likes"
                value={stats.totalFavorites}
                icon={<Heart className="size-4" />}
              />
              <ProfileMetric
                label="Seg."
                value={stats.totalFollowers}
                icon={<Users className="size-4" />}
              />
              <ProfileMetric
                label="Views"
                value={stats.totalViews}
                icon={<Eye className="size-4" />}
              />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2.5 sm:flex">
              <button
                onClick={() => setSellOpen(true)}
                className="sheen flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-bold text-white shadow-neon"
              >
                <Plus className="size-4" />
                Publicar
              </button>
              <Link
                to="/"
                className="flex items-center justify-center gap-2 rounded-xl bg-white/12 px-4 py-3 text-xs font-bold text-white backdrop-blur"
              >
                <Store className="size-4" />
                Ver loja
              </Link>
              <button
                onClick={handleLogout}
                className="col-span-2 flex items-center justify-center gap-2 rounded-xl bg-white/8 px-4 py-3 text-xs font-bold text-white/80 sm:col-span-1"
              >
                <LogOut className="size-4" />
                Sair
              </button>
            </div>
          </div>
        </section>

        <div className="glass-panel mt-5 grid grid-cols-3 rounded-2xl p-1">
          <ProfileTabButton
            active={tab === "publicacoes"}
            onClick={() => setTab("publicacoes")}
            icon={<Grid3X3 className="size-4" />}
            label="Posts"
          />
          <ProfileTabButton
            active={tab === "atividade"}
            onClick={() => setTab("atividade")}
            icon={<Bell className="size-4" />}
            label="Atividade"
          />
          <ProfileTabButton
            active={tab === "estatisticas"}
            onClick={() => setTab("estatisticas")}
            icon={<BarChart3 className="size-4" />}
            label="Dados"
          />
        </div>

        <section className="mt-5">
          {tab === "publicacoes" && (
            <ProfileListings vendorId={stats.vendorId} onCreate={() => setSellOpen(true)} />
          )}
          {tab === "atividade" && <ProfileNotifications />}
          {tab === "estatisticas" && <ProfileStats stats={stats} />}
        </section>
      </main>
    </div>
  );
}

function ProfileMetric({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-white/8 px-2 py-3">
      <div className="mx-auto mb-1 flex size-7 items-center justify-center rounded-full bg-white/10 text-primary">
        {icon}
      </div>
      <p className="text-lg font-black text-white">{value}</p>
      <p className="text-[10px] font-bold text-white/55">{label}</p>
    </div>
  );
}

function ProfileTabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition",
        active ? "bg-foreground text-background shadow-soft" : "text-muted-foreground",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function ProfileListings({
  vendorId,
  onCreate,
}: {
  vendorId: string | null;
  onCreate: () => void;
}) {
  const { data: listings = [], isLoading } = useQuery({
    queryKey: ["profile-listings", vendorId],
    enabled: !!vendorId,
    queryFn: async () => {
      const [productsRes, servicesRes] = await Promise.all([
        supabase.from("products").select("*").eq("vendor_id", vendorId),
        supabase.from("services").select("*").eq("vendor_id", vendorId),
      ]);
      const products = (productsRes.data || []).map((item) => ({ ...item, kind: "Produto" }));
      const services = (servicesRes.data || []).map((item) => ({ ...item, kind: "Serviço" }));
      return [...products, ...services].sort(
        (a: any, b: any) =>
          new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime(),
      );
    },
  });

  if (isLoading) return <LoadingTiles />;

  if (!vendorId || listings.length === 0) {
    return (
      <div className="luxe-card rounded-[24px] p-8 text-center">
        <Package className="mx-auto mb-3 size-9 text-primary" />
        <h2 className="text-lg font-black">Ainda sem publicações</h2>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
          Cria o teu primeiro produto ou serviço e ele aparece aqui no teu perfil.
        </p>
        <button
          onClick={onCreate}
          className="mt-5 rounded-xl bg-primary px-5 py-3 text-xs font-bold text-white shadow-neon"
        >
          Publicar agora
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {listings.map((item: any) => {
        const image = item.media_urls?.find((url: string) =>
          /\.(jpg|jpeg|png|webp|heic|heif)$/i.test(url),
        );
        return (
          <article
            key={`${item.kind}-${item.id}`}
            className="luxe-card overflow-hidden rounded-[20px]"
          >
            <div className="aspect-[4/5] bg-muted">
              {image ? (
                <img src={image} alt={item.name} className="size-full object-cover" />
              ) : (
                <div className="flex size-full items-center justify-center">
                  <Package className="size-8 text-muted-foreground/45" />
                </div>
              )}
            </div>
            <div className="p-3">
              <span className="rounded-full bg-accent px-2 py-0.5 text-[9px] font-bold text-accent-foreground">
                {item.kind}
              </span>
              <h3 className="mt-2 line-clamp-2 min-h-[34px] text-xs font-black">{item.name}</h3>
              <p className="mt-1 font-mono text-[11px] font-bold text-primary">
                {item.price ? `${Number(item.price).toLocaleString("pt-AO")} AOA` : "Preço aberto"}
              </p>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function ProfileNotifications() {
  const { notifications, markAllAsRead, isLoading } = useNotifications();

  if (isLoading) return <LoadingTiles />;
  if (!notifications?.length) {
    return (
      <div className="luxe-card rounded-[24px] p-8 text-center">
        <Bell className="mx-auto mb-3 size-9 text-primary" />
        <h2 className="text-lg font-black">Sem atividade nova</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Likes, follows e mensagens aparecem aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button onClick={() => markAllAsRead?.()} className="text-xs font-bold text-primary">
        Marcar tudo como lido
      </button>
      {notifications.map((notification: any) => (
        <div key={notification.id} className="luxe-card flex items-start gap-3 rounded-2xl p-4">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <Bell className="size-4" />
          </span>
          <div>
            <p className="text-sm font-bold">{notification.title || "Nova atividade"}</p>
            <p className="text-xs text-muted-foreground">
              {notification.content || notification.message}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ProfileStats({ stats }: { stats: ReturnType<typeof useVendorStats> }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <StatPanel label="Publicações ativas" value={stats.totalListings} />
      <StatPanel label="Favoritos recebidos" value={stats.totalFavorites} />
      <StatPanel label="Seguidoras" value={stats.totalFollowers} />
      <StatPanel label="Visualizações" value={stats.totalViews} />
    </div>
  );
}

function StatPanel({ label, value }: { label: string; value: number }) {
  return (
    <div className="luxe-card rounded-2xl p-5">
      <p className="text-[11px] font-bold uppercase text-muted-foreground">{label}</p>
      <p className="mt-2 text-4xl font-black">{value}</p>
      <div className="shimmer-line mt-5 h-px" />
    </div>
  );
}

function LoadingTiles() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="h-48 animate-pulse rounded-[20px] bg-muted" />
      ))}
    </div>
  );
}
