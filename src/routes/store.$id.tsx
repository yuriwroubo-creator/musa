import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { MessageCircle, MapPin, ShoppingBag, Heart, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useFollows } from "@/hooks/useFollows";
import { ProductCard } from "@/components/musa/Cards";
import { DetailModal } from "@/components/musa/DetailModal";
import { BuyModal } from "@/components/musa/BuyModal";

export const Route = createFileRoute("/store/$id")({
  component: StorePage,
});

function StorePage() {
  const { id } = Route.useParams();
  const [detailModalItem, setDetailModalItem] = useState<any | null>(null);
  const [buyModalItem, setBuyModalItem] = useState<any | null>(null);
  const { user, signInWithGoogle } = useAuth();
  const { checkIsFollowing, toggleFollow } = useFollows();

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
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("vendor_id", id)
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
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("vendor_id", id)
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
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
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
            <button
              onClick={handleMessage}
              disabled={!storeProfile?.whatsapp && !storeProfile?.phone}
              className={cn(
                "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition",
                (!storeProfile?.whatsapp && !storeProfile?.phone)
                  ? "bg-muted text-muted-foreground cursor-not-allowed"
                  : "bg-secondary text-foreground hover:bg-secondary/80"
              )}
            >
              <MessageCircle className="size-4" />
              Mensagem
            </button>
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

      {/* Products Grid */}
      <div className="px-4">
        <h2 className="text-lg font-bold text-foreground mb-4">Produtos e Serviços</h2>
        
        {loadingProducts || loadingServices ? (
          <div className="grid grid-cols-3 gap-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-square animate-pulse bg-muted" />
            ))}
          </div>
        ) : productsError || servicesError ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              Não foi possível carregar os produtos. Tenta novamente.
            </p>
          </div>
        ) : allItems.length === 0 ? (
          <div className="text-center py-8">
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