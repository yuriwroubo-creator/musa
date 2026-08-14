import { useEffect, useMemo, useState } from "react";
import { Check, Store, UserRound, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { MediaUploader } from "@/components/musa/MediaUploader";
import { registerVendor } from "@/lib/vendors";
import { cn } from "@/lib/utils";

type Choice = "guest" | "creator" | null;

type VendorRow = {
  id: string;
  business_name: string | null;
  full_name: string | null;
  phone: string | null;
  store_photo_url: string | null;
};

const storageKey = "musa-onboarding-choice";

function readStoredChoice(): Choice {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(storageKey);
  return value === "guest" || value === "creator" ? value : null;
}

export function OnboardingGate() {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);
  const [choice, setChoice] = useState<Choice>(null);
  const [storeName, setStoreName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [storePhotoUrl, setStorePhotoUrl] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: vendor } = useQuery({
    queryKey: ["creator-onboarding-vendor", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("vendor_subscriptions")
        .select("id, business_name, full_name, phone, store_photo_url")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error && error.code !== "PGRST116") throw error;
      return (data as VendorRow | null) ?? null;
    },
  });

  useEffect(() => {
    setMounted(true);
    setChoice(readStoredChoice());
  }, []);

  useEffect(() => {
    if (!vendor) return;
    setStoreName(vendor.business_name || "");
    setOwnerName(vendor.full_name || "");
    setPhone(vendor.phone || "");
    setStorePhotoUrl(vendor.store_photo_url || "");
  }, [vendor]);

  const creatorNeedsSetup = useMemo(() => {
    if (!choice || choice !== "creator") return false;
    if (!vendor) return true;
    return !vendor.business_name || !vendor.full_name || !vendor.store_photo_url;
  }, [choice, vendor]);

  if (!mounted || loading || !user) return null;
  if (choice === "guest") return null;
  if (choice === "creator" && !creatorNeedsSetup) return null;

  const persistChoice = (nextChoice: Choice) => {
    setChoice(nextChoice);
    if (typeof window !== "undefined" && nextChoice) {
      window.localStorage.setItem(storageKey, nextChoice);
    }
  };

  const syncProfile = async (fullName: string, avatarUrl: string) => {
    await supabase.auth.updateUser({
      data: {
        full_name: fullName,
        avatar_url: avatarUrl,
        musa_role: "creator",
      },
    });

    await supabase
      .from("profiles")
      .update({ full_name: fullName, avatar_url: avatarUrl })
      .eq("id", user.id);
  };

  const completeCreatorFlow = async () => {
    if (!storeName.trim() || !ownerName.trim() || !storePhotoUrl) {
      toast.error("Completa a foto e o nome da loja antes de continuar.");
      return;
    }

    setSaving(true);
    try {
      if (vendor) {
        const { error } = await supabase
          .from("vendor_subscriptions")
          .update({
            business_name: storeName.trim(),
            full_name: ownerName.trim(),
            phone: phone.trim() || null,
            store_photo_url: storePhotoUrl,
            status: "active",
          })
          .eq("id", vendor.id);
        if (error) throw error;
      } else {
        const result = await registerVendor({
          full_name: ownerName.trim(),
          phone: phone.trim() || "",
          business_name: storeName.trim(),
          store_photo_url: storePhotoUrl,
          status: "active",
          plan: "basic",
        });
        if (!result) throw new Error("Não foi possível criar a loja.");
      }

      await syncProfile(ownerName.trim(), storePhotoUrl);
      await queryClient.invalidateQueries({ queryKey: ["creator-onboarding-vendor", user.id] });
      persistChoice("creator");
      toast.success("Loja configurada", {
        description: "A tua marca já está pronta para publicar como criadora.",
      });
    } catch (error: unknown) {
      toast.error("Não foi possível guardar o teu perfil.", {
        description: error instanceof Error ? error.message : "Tenta novamente.",
      });
    } finally {
      setSaving(false);
    }
  };

  const completeGuestFlow = async () => {
    setSaving(true);
    try {
      await supabase.auth.updateUser({
        data: {
          musa_role: "guest",
        },
      });
      persistChoice("guest");
      toast.success("Modo convidada ativado", {
        description: "A experiência ficou adaptada para explorar a plataforma.",
      });
    } catch (error: unknown) {
      toast.error("Não foi possível guardar a opção.", {
        description: error instanceof Error ? error.message : "Tenta novamente.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/55 px-3 pb-3 backdrop-blur-md sm:items-center sm:p-5">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(12,12,16,.98),rgba(22,18,25,.96))] text-white shadow-[0_40px_120px_rgba(0,0,0,.45)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,45,120,.22),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(255,214,102,.14),transparent_30%)]" />
        <div className="relative p-5 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/72">
                <Sparkles className="size-3.5" />
                Boas-vindas MUSA
              </p>
              <h2 className="mt-4 text-3xl font-black leading-none sm:text-4xl">
                Como queres usar a MUSA?
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-white/68">
                Escolhe o teu modo para ajustarmos a experiência. Se fores criadora, pedimos foto
                pública da loja e o nome da marca para desbloquear o fluxo completo.
              </p>
            </div>
            <button
              onClick={() => persistChoice("guest")}
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/80 transition hover:bg-white/16"
              aria-label="Fechar onboarding"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <button
              onClick={() => {
                persistChoice("guest");
                void completeGuestFlow();
              }}
              disabled={saving}
              className={cn(
                "group rounded-[24px] border border-white/10 bg-white/6 p-5 text-left transition hover:-translate-y-0.5 hover:bg-white/10",
                choice === "guest" && "border-primary/50 bg-primary/12",
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-white/10 text-white">
                  <UserRound className="size-6" />
                </div>
                {choice === "guest" && <Check className="size-5 text-primary" />}
              </div>
              <h3 className="mt-4 text-xl font-black">Convidado</h3>
              <p className="mt-2 text-sm leading-6 text-white/66">
                Explora o catálogo, segue lojas, guarda favoritos e compra sem configurações extra.
              </p>
            </button>

            <button
              onClick={() => {
                persistChoice("creator");
              }}
              disabled={saving}
              className={cn(
                "group rounded-[24px] border border-white/10 bg-white/6 p-5 text-left transition hover:-translate-y-0.5 hover:bg-white/10",
                choice === "creator" && "border-primary/50 bg-primary/12",
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/18 text-primary">
                  <Store className="size-6" />
                </div>
                {choice === "creator" && <Check className="size-5 text-primary" />}
              </div>
              <h3 className="mt-4 text-xl font-black">Criador</h3>
              <p className="mt-2 text-sm leading-6 text-white/66">
                Configura a tua loja, coloca a foto pública e publica produtos ou serviços com a tua
                marca.
              </p>
            </button>
          </div>

          {choice === "creator" && (
            <div className="mt-6 rounded-[24px] border border-white/10 bg-white/6 p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/52">
                    Passo 2
                  </p>
                  <h3 className="mt-1 text-xl font-black">Define a tua loja</h3>
                </div>
                <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-white/70">
                  Público
                </span>
              </div>

              <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
                <Field label="Nome da Loja" value={storeName} onChange={setStoreName} />
                <Field label="Nome da Titular" value={ownerName} onChange={setOwnerName} />
              </div>
              <div className="mt-4">
                <Field
                  label="WhatsApp"
                  value={phone}
                  onChange={setPhone}
                  placeholder="923 000 000"
                />
              </div>
              <div className="mt-4">
                <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.12em] text-white/52">
                  Foto da Loja
                </label>
                <MediaUploader
                  maxFiles={1}
                  accept="image/*,.jpg,.jpeg,.png,.webp,.heic,.heif"
                  capture="environment"
                  onUploadComplete={(urls) => setStorePhotoUrl(urls[0] || "")}
                />
                {storePhotoUrl && (
                  <div className="mt-3 overflow-hidden rounded-2xl border border-white/10">
                    <img
                      src={storePhotoUrl}
                      alt="Foto da loja"
                      className="h-40 w-full object-cover"
                    />
                  </div>
                )}
              </div>

              <button
                onClick={() => void completeCreatorFlow()}
                disabled={saving}
                className="mt-5 flex w-full items-center justify-center rounded-2xl bg-primary px-4 py-3.5 text-sm font-bold text-primary-foreground shadow-[0_18px_40px_rgba(255,45,120,.35)] transition disabled:opacity-60"
              >
                {saving ? "A guardar..." : "Guardar e continuar"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.12em] text-white/52">
        {label}
      </label>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder || label}
        className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-primary/40"
      />
    </div>
  );
}
