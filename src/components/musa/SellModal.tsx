import { useMemo, useState } from "react";
import {
  X,
  Check,
  ShieldCheck,
  MessageCircle,
  Store,
  Package,
  Tag,
  FileText,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TurnstileWidget } from "@/components/TurnstileWidget";
import { publishItemFn } from "@/lib/publish.functions";
import { checkContent } from "@/lib/moderation/ai-check";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { MediaUploader } from "@/components/musa/MediaUploader";

const steps = [
  "Passo 1 · Dados da Loja",
  "Passo 2 · Publicar Produto ou Serviço",
  "Passo 3 · Confirmação",
];

const categories = [
  "Roupas & Moda",
  "Cabelos & Laces",
  "Maquilhagem",
  "Lingerie",
  "Acessórios",
  "Doces & Catering",
  "Bebidas Artesanais",
  "Beats & Áudio",
  "Design & Arte",
  "Serviços de Beleza",
  "Spa & Bem-estar",
  "Fotografia",
  "Videografia",
  "Produção Musical",
  "Outros",
];

const blockedWords = [
  "sexo",
  "porn",
  "porno",
  "nude",
  "nudes",
  "erotico",
  "erótico",
  "racista",
  "racismo",
  "odio",
  "ódio",
  "droga",
  "drogas",
  "cocaina",
  "cocaína",
  "fraude",
  "golpe",
  "arma",
  "matar",
  "assassino",
  "ilegal",
  "contrabando",
];

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function meaningfulWords(value: string) {
  return normalizeText(value)
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length >= 2);
}

function hasBlockedWords(...values: string[]) {
  const text = normalizeText(values.join(" "));
  return blockedWords.some((word) => text.includes(normalizeText(word)));
}

function validateStep1(shopName: string, ownerName: string, phone: string) {
  const errors: string[] = [];
  if (meaningfulWords(shopName).length < 2) {
    errors.push("Escreve o nome da loja/profissional com pelo menos 2 palavras.");
  }
  if (meaningfulWords(ownerName).length < 2) {
    errors.push("Escreve o nome completo da titular.");
  }
  const phoneDigits = phone.replace(/\D/g, "");
  if (phoneDigits.length > 0 && phoneDigits.length < 9) {
    errors.push("O WhatsApp deve ter pelo menos 9 números.");
  }
  if (hasBlockedWords(shopName, ownerName)) {
    errors.push("Remove palavras ofensivas ou impróprias dos dados da loja.");
  }
  return errors;
}

function validateStep2(
  productName: string,
  productPrice: string,
  productCategory: string,
  productDesc: string,
) {
  const errors: string[] = [];
  if (meaningfulWords(productName).length < 2) {
    errors.push("Escreve um nome mais completo para a publicação.");
  }
  const price = Number(productPrice);
  if (!productPrice.trim() || Number.isNaN(price) || price <= 0) {
    errors.push("Indica um preço válido em AOA.");
  }
  if (!productCategory) {
    errors.push("Escolhe uma categoria.");
  }
  if (productDesc.trim() && meaningfulWords(productDesc).length < 4) {
    errors.push("A descrição precisa de mais detalhe ou pode ficar vazia.");
  }
  if (hasBlockedWords(productName, productDesc)) {
    errors.push("Remove palavras ofensivas, obscenas ou ilegais da publicação.");
  }
  return errors;
}

export function SellModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, session, signInWithGoogle } = useAuth();
  const [step, setStep] = useState(1);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [shopName, setShopName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [productDesc, setProductDesc] = useState("");
  const [productType, setProductType] = useState<"produto" | "servico">("produto");
  const [catOpen, setCatOpen] = useState(false);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);

  const code = useMemo(() => `MUSA-${Math.floor(10000 + Math.random() * 89999)}`, []);

  const step1Errors = useMemo(
    () => validateStep1(shopName, ownerName, phone),
    [shopName, ownerName, phone],
  );
  const step2Errors = useMemo(
    () => validateStep2(productName, productPrice, productCategory, productDesc),
    [productName, productPrice, productCategory, productDesc],
  );
  const step1Valid = step1Errors.length === 0;
  const step2Valid = step2Errors.length === 0;

  const mutation = useMutation({
    mutationFn: async () => {
      const currentStepErrors = validateStep2(
        productName,
        productPrice,
        productCategory,
        productDesc,
      );
      if (currentStepErrors.length > 0) {
        throw new Error(currentStepErrors[0]);
      }

      // 1. AI Moderation Check
      const aiResult = await checkContent({
        data: {
          title: productName,
          description: productDesc,
        },
      });

      if (!aiResult.safe) {
        throw new Error(
          `O conteúdo foi bloqueado pela nossa moderação automática (Categoria: ${aiResult.category || "Inadequado"}). Por favor, revê o texto e tenta novamente.`,
        );
      }

      // 2. Publish Item Directly
      const res = await publishItemFn({
        data: {
          shopName,
          ownerName,
          phone,
          productName,
          productPrice,
          productCategory,
          productDesc,
          productType,
          turnstileToken,
          flagged_for_review: aiResult.flagged_for_review,
          access_token: session?.access_token || "",
          user_id: user?.id || "",
          media_urls: mediaUrls,
        },
      });
      if (!res.success) throw new Error(res.error || "Erro ao publicar.");
      return res;
    },
    onSuccess: () => {
      setStep(3);
      toast.success("Publicado com sucesso! 🎉", {
        description: "O teu artigo já está visível na plataforma MUSA.",
      });
    },
    onError: (error: unknown) => {
      const msg = error instanceof Error ? error.message : "";
      if (msg.includes("bloqueado pela nossa moderação")) {
        toast.error("🚫 Conteúdo Rejeitado", { description: msg });
      } else if (msg.includes("limite diário")) {
        toast.error("⏳ Limite Atingido", { description: msg });
      } else {
        toast.error("Erro ao publicar", {
          description: msg || "Verifica a tua ligação e tenta novamente.",
        });
      }
    },
  });

  const handleClose = () => {
    setStep(1);
    setTurnstileToken("");
    setShopName("");
    setOwnerName("");
    setPhone("");
    setProductName("");
    setProductPrice("");
    setProductCategory("");
    setProductDesc("");
    setMediaUrls([]);
    onClose();
  };

  const handleNext = () => {
    if (!step1Valid) {
      toast.error("Completa os dados da loja", { description: step1Errors[0] });
      return;
    }
    setStep(2);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Vender na MUSA"
      className={cn(
        "fixed inset-0 z-100 overflow-y-auto bg-background transition-transform duration-[400ms] ease-[cubic-bezier(.2,.8,.2,1)]",
        open ? "translate-y-0" : "translate-y-full",
      )}
    >
      <div className="mx-auto w-full max-w-2xl">
        {/* Header */}
        <div className="sticky top-0 z-5 flex items-center justify-between border-b border-border-soft bg-background/95 px-5 pb-2.5 pt-5 backdrop-blur-md">
          <div>
            <span className="display text-[17px]">Vender na MUSA</span>
            <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-accent-foreground">
              Gratuito
            </span>
          </div>
          <button
            onClick={handleClose}
            aria-label="Fechar"
            className="flex size-9 items-center justify-center rounded-full bg-secondary"
          >
            <X className="size-4" strokeWidth={1.8} />
          </button>
        </div>

        {/* Progress bar */}
        {user && (
          <div className="flex gap-1.5 px-5 pt-3.5">
            {[1, 2, 3].map((n) => (
              <span
                key={n}
                className={cn(
                  "h-[3px] flex-1 rounded-full transition-all duration-500",
                  n <= step ? "bg-primary" : "bg-border",
                )}
              />
            ))}
          </div>
        )}

        <div className="px-5 pt-4 pb-28">
          <p className="pb-4 text-xs text-muted-foreground">{steps[step - 1]}</p>

          {!user ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-accent text-accent-foreground">
                <Store className="size-8" />
              </div>
              <h3 className="mb-2 text-xl font-bold">Inicia Sessão para Vender</h3>
              <p className="mb-8 text-sm text-muted-foreground">
                Para publicares na MUSA precisas de associar a tua conta. O registo é grátis.
              </p>
              <button
                onClick={signInWithGoogle}
                className="w-full rounded-xl bg-primary px-4 py-3.5 text-[13px] font-bold text-primary-foreground shadow-neon transition-all hover:bg-primary/90"
              >
                Continuar com a Google
              </button>
            </div>
          ) : step === 1 ? (
            <div className="flex flex-col gap-0.5">
              <div className="mb-5 rounded-2xl border border-border-soft bg-card p-4 shadow-soft">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-8 items-center justify-center rounded-full bg-accent">
                    <Store className="size-4 text-accent-foreground" />
                  </span>
                  <div>
                    <p className="text-[12.5px] font-bold">Publicação gratuita</p>
                    <p className="text-[10.5px] text-muted-foreground">
                      Não há planos nem pagamentos. A MUSA é gratuita para todas as vendedoras.
                    </p>
                  </div>
                </div>
              </div>

              <Field
                label="Nome da Loja / Profissional"
                placeholder="Ex: Bela Hair Studio"
                value={shopName}
                onChange={setShopName}
              />
              <Field
                label="Nome da Titular"
                placeholder="O seu nome completo"
                value={ownerName}
                onChange={setOwnerName}
              />
              <Field
                label="WhatsApp para Clientes"
                placeholder="Ex: 923 000 000"
                value={phone}
                onChange={setPhone}
              />
              <ValidationList errors={step1Errors} />

              <div className="mt-2">
                <TurnstileWidget onVerify={setTurnstileToken} action="vendor_form" />
              </div>
            </div>
          ) : step === 2 ? (
            <div className="flex flex-col gap-0.5">
              <div className="mb-4 flex gap-2 rounded-2xl border border-border bg-card p-1.5 shadow-soft">
                {(["produto", "servico"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setProductType(type)}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-1.5 rounded-[14px] py-2.5 text-[12px] font-bold capitalize transition-all",
                      productType === type
                        ? "bg-primary text-primary-foreground shadow-neon"
                        : "text-muted-foreground hover:bg-accent/50",
                    )}
                  >
                    {type === "produto" ? (
                      <Package className="size-3.5" />
                    ) : (
                      <FileText className="size-3.5" />
                    )}
                    {type}
                  </button>
                ))}
              </div>

              <Field
                label={`Nome do ${productType === "produto" ? "Produto" : "Serviço"}`}
                placeholder="Ex: Limpeza de Pele Profunda"
                value={productName}
                onChange={setProductName}
              />
              <div className="relative mb-5">
                <label className="mb-1.5 block px-1 text-[11.5px] font-bold text-muted-foreground">
                  Categoria
                </label>
                <button
                  onClick={() => setCatOpen(!catOpen)}
                  className="flex w-full items-center justify-between rounded-xl border border-border-soft bg-background px-4 py-3 text-[13.5px] font-medium outline-none transition-colors focus:border-primary"
                >
                  <span className={!productCategory ? "opacity-50" : ""}>
                    {productCategory || "Selecionar categoria"}
                  </span>
                  <ChevronDown className="size-4 opacity-50" />
                </button>
                {catOpen && (
                  <div className="absolute left-0 top-full z-10 mt-1 w-full overflow-hidden rounded-xl border border-border-soft bg-background shadow-xl">
                    <div className="max-h-48 overflow-y-auto p-1">
                      {categories.map((c) => (
                        <button
                          key={c}
                          onClick={() => {
                            setProductCategory(c);
                            setCatOpen(false);
                          }}
                          className="w-full rounded-lg px-3 py-2.5 text-left text-[13px] hover:bg-accent"
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <Field
                label="Preço (AOA)"
                placeholder="Ex: 15000"
                value={productPrice}
                onChange={setProductPrice}
                type="number"
              />
              <div className="mb-5">
                <label className="mb-1.5 block px-1 text-[11.5px] font-bold text-muted-foreground">
                  Descrição Detalhada
                </label>
                <textarea
                  value={productDesc}
                  onChange={(e) => setProductDesc(e.target.value)}
                  placeholder="Descreve os detalhes, materiais, condições..."
                  className="h-24 w-full resize-none rounded-xl border border-border-soft bg-background px-4 py-3 text-[13.5px] font-medium outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-primary"
                />
              </div>
              <div className="mb-5">
                <label className="mb-1.5 block px-1 text-[11.5px] font-bold text-muted-foreground">
                  Fotos e Vídeos
                  <span className="ml-1 font-normal text-muted-foreground/60">(opcional)</span>
                </label>
                <MediaUploader
                  onUploadComplete={(urls) => setMediaUrls((prev) => [...prev, ...urls])}
                  maxFiles={5}
                />
                {mediaUrls.length > 0 && (
                  <p className="mt-1.5 px-1 text-[10.5px] text-primary font-medium">
                    ✓ {mediaUrls.length}{" "}
                    {mediaUrls.length === 1 ? "ficheiro carregado" : "ficheiros carregados"}
                  </p>
                )}
              </div>
              <ValidationList errors={step2Errors} />
            </div>
          ) : step === 3 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-primary/20 text-primary">
                <Check className="size-8" strokeWidth={3} />
              </div>
              <h3 className="mb-2 text-xl font-bold">Publicação Concluída!</h3>
              <p className="text-sm text-muted-foreground">
                O teu artigo já está disponível na plataforma MUSA.
              </p>
            </div>
          ) : null}
        </div>

        {/* Footer actions */}
        {user && step < 3 && (
          <div className="sticky bottom-0 border-t border-border-soft bg-background/80 p-5 backdrop-blur-md lg:p-6">
            <button
              onClick={step === 1 ? handleNext : () => mutation.mutate()}
              disabled={step === 1 ? !step1Valid : !step2Valid || mutation.isPending}
              className="flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3.5 text-[13px] font-bold text-primary-foreground shadow-neon transition-all disabled:opacity-50"
            >
              {mutation.isPending ? "A publicar..." : step === 1 ? "Continuar" : "Publicar Agora"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ValidationList({ errors }: { errors: string[] }) {
  if (errors.length === 0) {
    return (
      <div className="mb-5 flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-[11px] font-semibold text-primary">
        <ShieldCheck className="size-3.5" />
        Tudo certo para avançar.
      </div>
    );
  }

  return (
    <div className="mb-5 rounded-xl border border-destructive/25 bg-destructive/5 px-3 py-2">
      {errors.map((error) => (
        <p key={error} className="text-[11px] font-semibold text-destructive">
          {error}
        </p>
      ))}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <div className="mb-5">
      <label className="mb-1.5 block px-1 text-[11.5px] font-bold text-muted-foreground">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-border-soft bg-background px-4 py-3 text-[13.5px] font-medium outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-primary"
      />
    </div>
  );
}
