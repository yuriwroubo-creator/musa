import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, type ReactNode } from "react";
import {
  MessageCircle,
  MapPin,
  ShoppingBag,
  Heart,
  User,
  Grid3X3,
  Bell,
  Settings,
} from "lucide-react";
import { ChatButton } from "@/components/musa/ChatButton";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useFollows } from "@/hooks/useFollows";
import { DetailModal } from "@/components/musa/DetailModal";
import { BuyModal } from "@/components/musa/BuyModal";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/store/$id")({
  component: StorePage,
});

type StoreTab = "publicacoes" | "interacoes";

function StoreTabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition",
        active
          ? "bg-primary text-primary-foreground shadow-neon"
          : "bg-secondary text-muted-foreground hover:bg-secondary/80",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function StoreInteractionsTab() {
  return (
    <div className="py-6">
      <div className="rounded-2xl border border-border-soft bg-card p-6 text-center">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-accent">
          <Bell className="size-7 text-accent-foreground" />
        </div>
        <h3 className="text-base font-bold text-foreground">Mensagens & Interações</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Em breve vais ver aqui as curtidas e comentários recebidos nos teus Reels.
        </p>
        <div className="mt-6 space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-xl border border-border-soft bg-background p-3"
            >
              <div className="size-10 animate-pulse rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
                <div className="h-2 w-1/2 animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[11px] font-medium text-muted-foreground/70">
          Publica no Reels para começares a receber interações.
        </p>
      </div>
    </div>
  );
}

function StorePageSkeleton() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="relative">
        <div className="h-32 animate-pulse bg-gray-200/90" />

        <div className="relative px-4 pb-4">
          <div className="absolute -top-12 left-4">
            <div className="size-24 rounded-full border-4 border-background bg-gray-200/90" />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <div className="h-11 w-28 animate-pulse rounded-full bg-gray-200/90" />
            <div className="h-11 w-24 animate-pulse rounded-full bg-gray-200/90" />
          </div>

          <div className="mt-14 space-y-3">
            <div className="h-7 w-48 animate-pulse rounded-full bg-gray-200/90" />
            <div className="h-4 w-32 animate-pulse rounded-full bg-gray-200/90" />
            <div className="h-4 w-64 animate-pulse rounded-full bg-gray-200/90" />
            <div className="h-4 w-40 animate-pulse rounded-full bg-gray-200/90" />
            <div className="mt-4 flex gap-6">
              <div className="h-10 w-16 animate-pulse rounded-full bg-gray-200/90" />
              <div className="h-10 w-16 animate-pulse rounded-full bg-gray-200/90" />
            </div>
          </div>
        </div>
      </div>

      <div className="px-4">
        <div className="flex gap-2">
          <div className="h-11 flex-1 animate-pulse rounded-xl bg-gray-200/90" />
          <div className="h-11 flex-1 animate-pulse rounded-xl bg-gray-200/90" />
        </div>
      </div>

      <div className="px-4">
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="overflow-hidden rounded-[20px] border border-border-soft bg-white/80 shadow-sm">
              <div className="aspect-[4/5] animate-pulse bg-gray-200/90" />
              <div className="space-y-2 p-3">
                <div className="h-4 w-3/4 animate-pulse rounded-full bg-gray-200/90" />
                <div className="h-3 w-1/2 animate-pulse rounded-full bg-gray-200/90" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StorePage() {
  const { id } = Route.useParams();
  const [tab, setTab] = useState<StoreTab>("publicacoes");
  const [detailModalItem, setDetailModalItem] = useState<any | null>(null);
  const [buyModalItem, setBuyModalItem] = useState<any | null>(null);
  const { user, signInWithGoogle } = useAuth();
  const { checkIsFollowing, toggleFollow } = useFollows();
  const navigate = useNavigate();

  // Fetch store profile
  const { data: storeProfile, isLoading: loadingProfile, error: profileError } = useQuery({
    queryKey: ["store-profile", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch store products
  const { data: products, isLoading: loadingProducts, error: productsError } = useQuery({
    queryKey: ["store-products", id],
    queryFn: async () => {
      // Resolve vendor_subscriptions id for this profile (user)
      const { data: vendorData, error: vendorError } = await supabase
        .from("vendor_subscriptions")
        .select("id")
        .or(`user_id.eq.${id},vendor_id.eq.${id}`)
        .limit(1)
        .maybeSingle();

      if (vendorError) throw vendorError;
      const vendorId = vendorData?.id;

      if (!vendorId) return [];

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("vendor_id", vendorId)
        .or("is_reel.is.null,is_reel.eq.false")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  // Fetch store services
  const { data: services, isLoading: loadingServices, error: servicesError } = useQuery({
    queryKey: ["store-services", id],
    queryFn: async () => {
      // Resolve vendor_subscriptions id for this profile (user)
      const { data: vendorData, error: vendorError } = await supabase
        .from("vendor_subscriptions")
        .select("id")
        .or(`user_id.eq.${id},vendor_id.eq.${id}`)
        .limit(1)
        .maybeSingle();

      if (vendorError) throw vendorError;
      const vendorId = vendorData?.id;

      if (!vendorId) return [];

      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("vendor_id", vendorId)
        .or("is_reel.is.null,is_reel.eq.false")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  // Fetch followers count
  const { data: followersCount } = useQuery({
    queryKey: ["followers-count", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("follows")
        .select("*")
        .eq("following_id", id);

      if (error) throw error;
      return data?.length || 0;
    },
    enabled: !!id,
  });

  const isFollowing = storeProfile ? checkIsFollowing(storeProfile.id) : false;
  const isOwner = String(user?.id) === String(storeProfile?.id);

  const handleFollow = () => {
    if (!user) {
      signInWithGoogle();
      return;
    }
    if (storeProfile) {
      toggleFollow.mutate({ followingId: storeProfile.id, isFollowing });
    }
  };

  const handleMessage = () => {
    if (storeProfile?.whatsapp || storeProfile?.phone) {
      const phone = storeProfile.whatsapp || storeProfile.phone;
      window.open(`https://wa.me/${phone.replace(/\D/g, "")}`, "_blank");
    }
  };

  if (profileError || (!loadingProfile && !storeProfile)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold text-foreground">Loja não encontrada</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            A loja que procuras não existe ou foi removida.
          </p>
        </div>
      </div>
    );
  }

  if (loadingProfile) {
    return <StorePageSkeleton />;
  }

  const allItems = [...(products || []), ...(services || [])];
  const totalPosts = allItems.length;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="relative">
        {/* Cover photo */}
        <div className="h-32 bg-gradient-to-br from-primary/20 to-accent/20">
          {storeProfile?.cover_url && (
            <img
              src={storeProfile.cover_url}
              alt="Cover"
              className="h-full w-full object-cover"
            />
          )}
        </div>

        {/* Profile info */}
        <div className="relative px-4 pb-4">
          {/* Avatar */}
          <div className="absolute -top-12 left-4">
            <div className="size-24 overflow-hidden rounded-full border-4 border-background bg-gradient-to-br from-primary/20 to-accent/20">
              {storeProfile?.avatar_url ? (
                <img
                  src={storeProfile.avatar_url}
                  alt={storeProfile.full_name || "Avatar"}
                  className="size-full object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center">
                  <span className="text-3xl font-bold text-primary">
                    {(storeProfile?.full_name || storeProfile?.business_name || "M")?.[0]}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-2 pt-2">
            {isOwner && (
              <button
                type="button"
                onClick={() => navigate({ to: "/perfil" })}
                className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold bg-white/12 text-white backdrop-blur transition hover:bg-white/18"
                aria-label="Editar perfil"
              >
                <Settings className="size-4" />
                Editar perfil
              </button>
            )}
            {storeProfile?.id ? (
              <ChatButton vendorUserId={storeProfile.id} label="Mensagem" />
            ) : (
              <button
                disabled
                className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold bg-muted text-muted-foreground cursor-not-allowed"
              >
                <MessageCircle className="size-4" />
                Mensagem
              </button>
            )}
            <button
              onClick={handleFollow}
              disabled={toggleFollow.isPending}
              className={cn(
                "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition",
                isFollowing
                  ? "bg-secondary text-foreground hover:bg-secondary/80"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
            >
              <Heart className={cn("size-4", isFollowing && "fill-current")} />
              {isFollowing ? "A seguir" : "Seguir"}
            </button>
          </div>

          {/* Store info */}
          <div className="mt-14">
            <h1 className="text-2xl font-bold text-foreground">
              {storeProfile?.full_name || storeProfile?.business_name || "Loja MUSA"}
            </h1>
            
            {storeProfile?.business_name && storeProfile?.full_name && (
              <p className="text-sm text-muted-foreground">{storeProfile.business_name}</p>
            )}

            {storeProfile?.bio && (
              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                {storeProfile.bio}
              </p>
            )}

            {/* Location */}
            {storeProfile?.location && (
              <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="size-4" />
                <span>{storeProfile.location}</span>
              </div>
            )}

            {/* Stats */}
            <div className="mt-4 flex gap-6">
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">{totalPosts}</p>
                <p className="text-xs text-muted-foreground">Publicações</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">{followersCount || 0}</p>
                <p className="text-xs text-muted-foreground">Seguidores</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4">
        <div className="flex gap-2">
          <StoreTabButton
            active={tab === "publicacoes"}
            onClick={() => setTab("publicacoes")}
            icon={<Grid3X3 className="size-4" />}
            label="Publicações"
          />
          <StoreTabButton
            active={tab === "interacoes"}
            onClick={() => setTab("interacoes")}
            icon={<MessageCircle className="size-4" />}
            label="Mensagens / Interações"
          />
        </div>
      </div>

      {/* Tab content */}
      <div className="px-4">
        {tab === "publicacoes" && (
          <>
            <h2 className="mb-4 mt-5 text-lg font-bold text-foreground">Produtos e Serviços</h2>

            {loadingProducts || loadingServices ? (
              <div className="grid grid-cols-3 gap-1">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="aspect-square animate-pulse bg-muted" />
                ))}
              </div>
            ) : productsError || servicesError ? (
              <div className="py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Não foi possível carregar os produtos. Tenta novamente.
                </p>
              </div>
            ) : allItems.length === 0 ? (
              <div className="py-8 text-center">
                <ShoppingBag className="mx-auto size-12 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">
                  Esta loja ainda não tem produtos publicados.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1">
                {allItems.map((item: any) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setDetailModalItem(item);
                    }}
                    className="relative aspect-square cursor-pointer overflow-hidden bg-muted"
                  >
                    {item.img || item.image_url || item.media_urls?.[0] ? (
                      <img
                        src={item.img || item.image_url || item.media_urls?.[0]}
                        alt={item.name || item.title}
                        className="size-full object-cover transition hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
                        <User className="size-8 text-muted-foreground/50" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === "interacoes" && <StoreInteractionsTab />}
      </div>

      {/* Detail Modal */}
      <DetailModal
        open={!!detailModalItem}
        onClose={() => setDetailModalItem(null)}
        item={detailModalItem || {}}
      />

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
