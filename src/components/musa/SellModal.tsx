import { useMemo, useState } from "react";
import { X, Check, ShieldCheck, MessageCircle, Store, Package, Tag, FileText, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { TurnstileWidget } from "@/components/TurnstileWidget";
import { publishItemFn } from "@/lib/publish.functions";
import { checkContent } from "@/lib/moderation/ai-check";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

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
  "Serviços de Beleza",
  "Spa & Bem-estar",
  "Outros",
];

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

  const code = useMemo(
    () => `MUSA-${Math.floor(10000 + Math.random() * 89999)}`,
    [],
  );

  const step1Valid = shopName.trim() && ownerName.trim() && phone.trim() && turnstileToken;
  const step2Valid = productName.trim() && productPrice.trim() && productCategory;

  const mutation = useMutation({
    mutationFn: async () => {
      // 1. AI Moderation Check
      const aiResult = await checkContent({
        data: {
          title: productName,
          description: productDesc,
        },
      });

      if (!aiResult.safe) {
        throw new Error(`O conteúdo foi bloqueado pela nossa moderação automática (Categoria: ${aiResult.category || "Inadequado"}). Por favor, revê o texto e tenta novamente.`);
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
        },
      });
      if (!res.success) throw new Error(res.error || "Erro ao publicar.");
      return res;
    },
    onSuccess: () => {
      toast.success("Pedido enviado com sucesso! ✅", {
        description: "A nossa equipa vai rever a publicação em breve.",
      });
      handleClose();
    },
    onError: (error: any) => {
      // If it's an AI block error, we show it clearly
      if (error.message.includes("bloqueado pela nossa moderação")) {
        toast.error("Submissão Rejeitada", {
          description: error.message,
        });
      } else {
        toast.error("Ocorreu um erro.", {
          description: "Não foi possível enviar o pedido de publicação.",
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
    onClose();
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
        <div className="sticky top-0 z-5 flex items-center justify-between border-b border-border-soft bg-background px-5 pt-5 pb-2.5">
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
              <div className="mb-5 rounded-2xl border border-border-soft bg-card p-4">
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

              <div className="mt-2">
                <TurnstileWidget onVerify={setTurnstileToken} action="vendor_form" />
              </div>
            </div>
          ) : step === 2 ? (
            <div className="flex flex-col gap-0.5">
              <div className="mb-4 flex gap-2 rounded-xl border border-border bg-card p-1">
                {(['produto', 'servico'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setProductType(type)}
                    className={cn(
                      'flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-[12px] font-bold capitalize transition-all',
                      productType === type
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-accent/50',
                    )}
                  >
                    {type === 'produto' ? <Package className="size-3.5" /> : <FileText className="size-3.5" />}
                    {type}
                  </button>
                ))}
              </div>

              <Field
                label={`Nome do ${productType === 'produto' ? 'Produto' : 'Serviço'}`}
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
                  <span className={!productCategory ? 'opacity-50' : ''}>
                    {productCategory || 'Selecionar categoria'}
                  </span>
                  <ChevronDown className="size-4 opacity-50" />
                </button>
                {catOpen && (
                  <div className="absolute top-full left-0 z-10 mt-1 w-full overflow-hidden rounded-xl border border-border-soft bg-background shadow-xl">
                    <div className="max-h-48 overflow-y-auto p-1">
                      {categories.map((c) => (
                        <button
                          key={c}
                          onClick={() => {
                            setProductCategory(c);
                            setCatOpen(false);
                          }}
                          className="w-full rounded-lg px-3 py-2.5 text-left text-[13px] hover:bg-accent">
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
              onClick={step === 1 ? () => setStep(2) : () => mutation.mutate()}
              disabled={step === 1 ? !step1Valid : !step2Valid || mutation.isPending}
              className="flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3.5 text-[13px] font-bold text-primary-foreground shadow-neon transition-all disabled:opacity-50"
            >
              {mutation.isPending
                ? "A publicar..."
                : step === 1
                  ? "Continuar"
                  : "Publicar Agora"}
            </button>
          </div>
        )}
      </div>
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
