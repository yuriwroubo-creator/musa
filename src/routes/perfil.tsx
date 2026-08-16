/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart3,
  Bell,
  Camera,
  Grid3X3,
  Heart,
  LogOut,
  Package,
  Pencil,
  Plus,
  Save,
  Settings,
  Store,
  User as UserIcon,
  Users,
  Eye,
  MessageCircle,
  Shield,
  UserCog,
  Bookmark,
  Trash2,
  ImagePlus,
  X,
} from "lucide-react";
import { SiteHeader } from "@/components/musa/SiteHeader";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { useSellModal } from "@/lib/SellContext";
import { useVendorStats } from "@/hooks/useVendorStats";
import { cn } from "@/lib/utils";
import { MediaUploader } from "@/components/musa/MediaUploader";
import { PlaceholderArt } from "@/components/musa/PlaceholderArt";
import { toast } from "sonner";
import { deleteItemFn, updateItemFn } from "@/lib/publish.functions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/perfil")({
  component: ProfilePage,
});

type ProfileTab = "publicacoes" | "colecoes" | "estatisticas";

function ProfilePage() {
  const { user, loading, signOut } = useAuth();
  const { setPublishSheetOpen } = useSellModal();
  const navigate = useNavigate();
  const [tab, setTab] = useState<ProfileTab>("publicacoes");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
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
    return <ProfileSkeleton />;
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
        onPublishClick={() => setPublishSheetOpen(true)}
      />

      <main className="mx-auto w-full max-w-5xl px-5 pt-5 lg:px-8 lg:pt-8">
        <section className="overflow-hidden rounded-[28px] bg-foreground text-background shadow-luxe">
          <div className="h-32 bg-gradient-to-br from-primary via-[#171014] to-[color:var(--jade)] lg:h-44" />
          <div className="px-5 pb-6 sm:px-7">
            <div className="-mt-12 flex items-end justify-between gap-4">
              <div className="flex items-end gap-4">
                <button
                  type="button"
                  onClick={() => setEditProfileOpen(true)}
                  className="group relative flex size-24 items-center justify-center overflow-hidden rounded-full border-4 border-background bg-card text-foreground shadow-luxe transition hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary/40 lg:size-32"
                  aria-label="Alterar foto de perfil"
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={fullName} className="size-full object-cover" />
                  ) : (
                    <UserIcon className="size-9" />
                  )}
                  <span className="absolute inset-0 bg-black/0 transition group-hover:bg-black/10" />
                  <span className="absolute bottom-2 right-2 flex size-8 items-center justify-center rounded-full bg-black/70 text-white opacity-0 shadow-lg transition group-hover:opacity-100">
                    <Camera className="size-4" />
                  </span>
                </button>
                <div className="pb-2">
                  <h1 className="max-w-[15rem] truncate text-xl font-black text-white lg:text-3xl">
                    {fullName}
                  </h1>
                  <p className="mt-1 text-xs font-medium text-white/62">{user.email}</p>
                </div>
              </div>
              <button
                aria-label="Definições"
                onClick={() => setSettingsOpen(true)}
                className="mb-2 flex size-10 items-center justify-center rounded-full bg-white/12 text-white backdrop-blur transition hover:bg-white/18"
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
                onClick={() => setPublishSheetOpen(true)}
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
            active={tab === "colecoes"}
            onClick={() => setTab("colecoes")}
            icon={<Bookmark className="size-4" />}
            label="Coleções"
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
            <ProfileListings vendorId={stats.vendorId} onCreate={() => setPublishSheetOpen(true)} />
          )}
          {tab === "colecoes" && <ProfileCollections />}
          {tab === "estatisticas" && <ProfileStats stats={stats} />}
        </section>
      </main>

      <ProfileSettingsSheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onEditProfile={() => {
          setSettingsOpen(false);
          setEditProfileOpen(true);
        }}
        onOpenStats={() => {
          setSettingsOpen(false);
          setTab("estatisticas");
        }}
        onOpenActivity={() => {
          setSettingsOpen(false);
          setTab("atividade");
        }}
        onOpenSaved={() => {
          setSettingsOpen(false);
          navigate({ to: "/favoritos" });
        }}
        onOpenMessages={() => {
          setSettingsOpen(false);
          navigate({ to: "/mensagens" });
        }}
      />

      <EditProfileModal
        open={editProfileOpen}
        onClose={() => setEditProfileOpen(false)}
        currentName={fullName}
        currentAvatarUrl={avatarUrl || ""}
        userId={user.id}
      />
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
  const [editing, setEditing] = useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const { session } = useAuth();
  const queryClient = useQueryClient();
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

  const deleteMutation = useMutation({
    mutationFn: async (item: any) => {
      if (!session?.access_token) {
        throw new Error("Sessão inválida.");
      }
      const result = await deleteItemFn({
        data: {
          itemId: item.id,
          itemType: item.kind === "Serviço" ? "servico" : "produto",
          access_token: session.access_token,
        },
      });
      if (!result.success) throw new Error(result.error || "Não foi possível apagar.");
      if ("warning" in result && result.warning) {
        toast.warning("Publicação apagada com aviso", { description: result.warning });
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["profile-listings", vendorId] });
      await queryClient.invalidateQueries({ queryKey: ["products_with_views"] });
      await queryClient.invalidateQueries({ queryKey: ["services"] });
      toast.success("Publicação apagada.");
      setDeleteTarget(null);
    },
    onError: (error: any) => {
      toast.error("Não foi possível apagar", {
        description: error?.message || "Tenta novamente.",
      });
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
                <PlaceholderArt
                  title={item.name}
                  kind={item.kind === "Serviço" ? "service" : "product"}
                />
              )}
            </div>
            <div className="p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-full bg-accent px-2 py-0.5 text-[9px] font-bold text-accent-foreground">
                  {item.kind}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setEditing(item)}
                    className="flex size-7 items-center justify-center rounded-full bg-secondary text-muted-foreground transition hover:text-foreground"
                    aria-label={`Editar ${item.name}`}
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(item)}
                    className="flex size-7 items-center justify-center rounded-full bg-destructive/10 text-destructive transition hover:bg-destructive hover:text-white"
                    aria-label={`Apagar ${item.name}`}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
              <h3 className="mt-2 line-clamp-2 min-h-[34px] text-xs font-black">{item.name}</h3>
              <p className="mt-1 font-mono text-[11px] font-bold text-primary">
                {item.price ? `${Number(item.price).toLocaleString("pt-AO")} AOA` : "Preço aberto"}
              </p>
            </div>
          </article>
        );
      })}
      <EditListingModal item={editing} vendorId={vendorId} onClose={() => setEditing(null)} />
      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent className="rounded-[24px] border-border-soft bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar esta publicação?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação remove a publicação da loja. Se houver ficheiros no bucket público, vamos
              tentar removê-los também.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                if (deleteTarget) {
                  deleteMutation.mutate(deleteTarget);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "A apagar..." : "Apagar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function EditListingModal({
  item,
  vendorId,
  onClose,
}: {
  item: any | null;
  vendorId: string | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);

  useEffect(() => {
    if (!item) return;
    setName(item.name || "");
    setPrice(item.price ? String(item.price) : "");
    setCategory(item.category || "");
    setDescription(item.description || "");
    setMediaUrls(Array.isArray(item.media_urls) ? item.media_urls : []);
  }, [item]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!item || !vendorId) return;
      const res = await updateItemFn({
        data: {
          itemId: item.id,
          itemType: item.kind === "Serviço" ? "servico" : "produto",
          productName: name,
          productPrice: price,
          productCategory: category,
          productDesc: description,
          media_urls: mediaUrls,
          access_token: session?.access_token || "",
        },
      });
      if (!res.success) throw new Error(res.error || "Não foi possível guardar.");
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["profile-listings", vendorId] });
      await queryClient.invalidateQueries({ queryKey: ["products_with_views"] });
      await queryClient.invalidateQueries({ queryKey: ["services"] });
      toast.success("Publicação atualizada.");
      onClose();
    },
    onError: (error: any) => {
      toast.error("Não foi possível guardar", {
        description: error?.message || "Confere os dados e tenta novamente.",
      });
    },
  });

  if (!item) return null;

  const imageUrls = mediaUrls.filter((url) => /\.(jpg|jpeg|png|webp|heic|heif)$/i.test(url));

  return (
    <div className="fixed inset-0 z-[95] overflow-y-auto bg-foreground/50 px-4 py-5 backdrop-blur-sm">
      <div className="mx-auto max-w-xl rounded-[26px] bg-card p-5 shadow-luxe">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-1 text-[10px] font-bold text-accent-foreground">
              <Pencil className="size-3" />
              Editar publicação
            </p>
            <h2 className="mt-3 text-xl font-black">Atualizar detalhes e fotos</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full bg-secondary px-3 py-2 text-xs font-bold"
          >
            Fechar
          </button>
        </div>

        <div className="mt-5 grid gap-4">
          <EditField label="Nome" value={name} onChange={setName} />
          <EditField label="Preço (AOA)" value={price} onChange={setPrice} type="number" />
          <EditField label="Categoria" value={category} onChange={setCategory} />
          <div>
            <label className="mb-1.5 block px-1 text-[11.5px] font-bold text-muted-foreground">
              Descrição
            </label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="h-24 w-full resize-none rounded-xl border border-border-soft bg-background px-4 py-3 text-[13.5px] font-medium outline-none focus:border-primary"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center gap-2 px-1 text-[11.5px] font-bold text-muted-foreground">
              <Camera className="size-3.5" />
              Fotos
            </div>
            {imageUrls.length > 0 && (
              <div className="mb-3 grid grid-cols-3 gap-2">
                {imageUrls.map((url) => (
                  <div
                    key={url}
                    className="relative aspect-square overflow-hidden rounded-xl bg-muted"
                  >
                    <img src={url} alt="" className="size-full object-cover" />
                    <button
                      type="button"
                      onClick={() =>
                        setMediaUrls((current) => current.filter((itemUrl) => itemUrl !== url))
                      }
                      className="absolute right-1 top-1 rounded-full bg-black/60 px-2 py-1 text-[10px] font-bold text-white"
                    >
                      Remover
                    </button>
                  </div>
                ))}
              </div>
            )}
            {mediaUrls.length < 5 ? (
              <MediaUploader
                maxFiles={5 - mediaUrls.length}
                onUploadComplete={(urls) =>
                  setMediaUrls((current) => [...current, ...urls].slice(0, 5))
                }
              />
            ) : (
              <p className="rounded-xl bg-secondary px-3 py-2 text-[11px] font-semibold text-muted-foreground">
                Limite de 5 ficheiros atingido. Remove uma foto para adicionar outra.
              </p>
            )}
          </div>

          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || name.trim().length < 2}
            className="flex items-center justify-center gap-2 rounded-2xl bg-primary py-3 text-sm font-bold text-primary-foreground shadow-neon disabled:opacity-50"
          >
            <Save className="size-4" />
            {mutation.isPending ? "A guardar..." : "Guardar alterações"}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block px-1 text-[11.5px] font-bold text-muted-foreground">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-border-soft bg-background px-4 py-3 text-[13.5px] font-medium outline-none focus:border-primary"
      />
    </div>
  );
}

function ProfileCollections() {
  const { user } = useAuth();
  const { data: favorites } = useQuery({
    queryKey: ["user-favorites", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("favorites")
        .select("*, products(*), services(*)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  if (!favorites) {
    return <LoadingTiles />;
  }

  if (!favorites.length) {
    return (
      <div className="luxe-card rounded-[24px] p-8 text-center">
        <Bookmark className="mx-auto mb-3 size-9 text-primary" />
        <h2 className="text-lg font-black">Sem coleções ainda</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Os itens que guardares dos Reels aparecerão aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {favorites.map((favorite: any) => {
        const item = favorite.products || favorite.services;
        if (!item) return null;

        const imageUrl = item.img || item.image_url || item.media_urls?.[0];
        const title = item.name || item.title || "Sem título";
        const price = item.price;

        return (
          <div
            key={favorite.id}
            className="luxe-card overflow-hidden rounded-[20px] transition-all hover:-translate-y-1 hover:shadow-luxe"
          >
            <div className="relative aspect-square overflow-hidden bg-muted">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={title}
                  className="size-full object-cover"
                  loading="lazy"
                />
              ) : (
                <PlaceholderArt title={title} />
              )}
              <div className="absolute top-2 right-2 flex size-8 items-center justify-center rounded-full bg-[#FF5BA3] text-white">
                <Bookmark className="size-4 fill-current" />
              </div>
            </div>
            <div className="p-3">
              <h3 className="line-clamp-2 text-sm font-bold">{title}</h3>
              {price && (
                <p className="mt-1 text-xs font-bold text-[#FF5BA3]">
                  {typeof price === "number"
                    ? new Intl.NumberFormat("pt-AO", {
                        style: "currency",
                        currency: "AOA",
                        minimumFractionDigits: 0,
                      }).format(price)
                    : price}
                </p>
              )}
            </div>
          </div>
        );
      })}
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

function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-5 pt-5 lg:px-8 lg:pt-8">
        <section className="overflow-hidden rounded-[28px] bg-white/90 shadow-luxe backdrop-blur-md">
          <div className="h-32 animate-pulse bg-gray-200/90 lg:h-44" />
          <div className="px-5 pb-6 sm:px-7">
            <div className="-mt-12 flex items-end justify-between gap-4">
              <div className="flex items-end gap-4">
                <div className="size-24 rounded-full border-4 border-background bg-gray-200/90 shadow-luxe lg:size-32" />
                <div className="space-y-3 pb-2">
                  <div className="h-6 w-56 animate-pulse rounded-full bg-gray-200/90" />
                  <div className="h-4 w-40 animate-pulse rounded-full bg-gray-200/90" />
                </div>
              </div>
              <div className="size-10 animate-pulse rounded-full bg-gray-200/90" />
            </div>

            <div className="mt-5 grid grid-cols-4 gap-2 rounded-2xl bg-gray-100/80 p-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="rounded-xl bg-gray-200/90 px-2 py-3">
                  <div className="mx-auto mb-2 h-7 w-7 rounded-full bg-gray-300/90" />
                  <div className="mx-auto h-4 w-8 rounded-full bg-gray-300/90" />
                  <div className="mx-auto mt-2 h-2.5 w-10 rounded-full bg-gray-300/90" />
                </div>
              ))}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2.5 sm:flex">
              <div className="h-12 flex-1 animate-pulse rounded-xl bg-gray-200/90" />
              <div className="h-12 flex-1 animate-pulse rounded-xl bg-gray-200/90" />
              <div className="h-12 flex-1 animate-pulse rounded-xl bg-gray-200/90" />
            </div>
          </div>
        </section>

        <div className="grid grid-cols-3 gap-1.5 rounded-2xl bg-gray-100/80 p-1.5">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-11 animate-pulse rounded-xl bg-gray-200/90" />
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="rounded-2xl border border-border-soft bg-white/80 p-5 shadow-sm">
              <div className="h-4 w-32 animate-pulse rounded-full bg-gray-200/90" />
              <div className="mt-4 h-10 w-20 animate-pulse rounded-full bg-gray-200/90" />
              <div className="mt-6 h-px w-full animate-pulse bg-gray-200/90" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProfileSettingsSheet({
  open,
  onClose,
  onEditProfile,
  onOpenStats,
  onOpenActivity,
  onOpenSaved,
  onOpenMessages,
}: {
  open: boolean;
  onClose: () => void;
  onEditProfile: () => void;
  onOpenStats: () => void;
  onOpenActivity: () => void;
  onOpenSaved: () => void;
  onOpenMessages: () => void;
}) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] transition-opacity duration-300",
        open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
      )}
      aria-hidden={!open}
    >
      <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={onClose} />
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 rounded-t-[28px] border-t border-border-soft bg-card px-5 pb-6 pt-4 shadow-[0_-24px_60px_rgba(0,0,0,.2)] transition-transform duration-300 sm:left-1/2 sm:bottom-6 sm:w-full sm:max-w-xl sm:-translate-x-1/2 sm:rounded-[28px]",
          open ? "translate-y-0" : "translate-y-full sm:translate-y-[calc(100%+24px)]",
        )}
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-border sm:hidden" />
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-[10px] font-bold uppercase text-accent-foreground">
              <Settings className="size-3.5" />
              Definições
            </p>
            <h3 className="mt-3 text-2xl font-black">Ajusta a tua conta</h3>
          </div>
          <button
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-full bg-secondary text-muted-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-5 grid gap-3">
          <SettingsAction
            icon={<UserCog className="size-4" />}
            title="Editar Perfil"
            description="Atualiza nome, foto e detalhes da conta."
            onClick={onEditProfile}
          />
          <SettingsAction
            icon={<BarChart3 className="size-4" />}
            title="Estatísticas da Loja"
            description="Vê o desempenho das tuas publicações."
            onClick={onOpenStats}
          />
          <SettingsAction
            icon={<Bell className="size-4" />}
            title="Actividades"
            description="Abre o histórico de alertas e interações."
            onClick={onOpenActivity}
          />
          <SettingsAction
            icon={<Bookmark className="size-4" />}
            title="Guardados"
            description="Abre os favoritos e itens guardados."
            onClick={onOpenSaved}
          />
          <SettingsAction
            icon={<MessageCircle className="size-4" />}
            title="Mensagens"
            description="Vai para as tuas conversas e chats."
            onClick={onOpenMessages}
          />
        </div>
      </div>
    </div>
  );
}

function SettingsAction({
  icon,
  title,
  description,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 rounded-[22px] border border-border-soft bg-background px-4 py-4 text-left transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-soft"
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-black">{title}</span>
        <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">{description}</span>
      </span>
    </button>
  );
}

function EditProfileModal({
  open,
  onClose,
  currentName,
  currentAvatarUrl,
  userId,
}: {
  open: boolean;
  onClose: () => void;
  currentName: string;
  currentAvatarUrl: string;
  userId: string;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(currentName);
  const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(currentName);
    setAvatarUrl(currentAvatarUrl);
  }, [open, currentName, currentAvatarUrl]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Escreve um nome válido.");
      return;
    }

    setSaving(true);
    try {
      await supabase.auth.updateUser({
        data: {
          full_name: name.trim(),
          avatar_url: avatarUrl || undefined,
        },
      });

      await supabase
        .from("profiles")
        .update({
          full_name: name.trim(),
          avatar_url: avatarUrl || null,
        })
        .eq("id", userId);

      await queryClient.invalidateQueries({ queryKey: ["profile", userId] });
      toast.success("Perfil atualizado.");
      onClose();
    } catch (error: any) {
      toast.error("Não foi possível atualizar o perfil.", {
        description: error?.message || "Tenta novamente.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className={cn(
        "fixed inset-0 z-[105] flex items-end justify-center bg-black/45 px-3 pb-3 backdrop-blur-sm transition-opacity duration-300 sm:items-center sm:p-5",
        open ? "opacity-100" : "pointer-events-none opacity-0",
      )}
      aria-hidden={!open}
    >
      <div
        className={cn(
          "w-full max-w-xl rounded-[28px] border border-border-soft bg-card p-5 shadow-luxe transition-transform duration-300",
          open ? "translate-y-0" : "translate-y-full sm:translate-y-8",
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-[10px] font-bold uppercase text-accent-foreground">
              <UserCog className="size-3.5" />
              Editar Perfil
            </p>
            <h3 className="mt-3 text-2xl font-black">Atualiza os teus dados</h3>
          </div>
          <button
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-full bg-secondary text-muted-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <label className="mb-1.5 block px-1 text-[11.5px] font-bold text-muted-foreground">
              Nome de perfil
            </label>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-xl border border-border-soft bg-background px-4 py-3 text-[13.5px] font-medium outline-none focus:border-primary"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center gap-2 px-1 text-[11.5px] font-bold text-muted-foreground">
              <ImagePlus className="size-3.5" />
              Foto de perfil
            </div>
            <MediaUploader
              maxFiles={1}
              accept="image/*,.jpg,.jpeg,.png,.webp,.heic,.heif"
              onUploadComplete={(urls) => setAvatarUrl(urls[0] || "")}
            />
            {avatarUrl && (
              <div className="mt-3 overflow-hidden rounded-2xl border border-border-soft">
                <img src={avatarUrl} alt="Avatar" className="h-40 w-full object-cover" />
              </div>
            )}
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex w-full items-center justify-center rounded-2xl bg-primary px-4 py-3.5 text-sm font-bold text-primary-foreground shadow-neon disabled:opacity-60"
          >
            {saving ? "A guardar..." : "Guardar alterações"}
          </button>
        </div>
      </div>
    </div>
  );
}
