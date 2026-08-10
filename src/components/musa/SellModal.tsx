import { useMemo, useState } from "react";
import { X, Check, ShieldCheck, MessageCircle, Store, Package, Tag, FileText, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [step, setStep] = useState(1);
  const [robot, setRobot] = useState(false);
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

  const step1Valid = shopName.trim() && ownerName.trim() && phone.trim() && robot;
  const step2Valid = productName.trim() && productPrice.trim() && productCategory;

  const whatsappMsg = encodeURIComponent(
    `Olá MUSA! 👋 Quero publicar na plataforma.\n\nLoja: ${shopName}\nTitular: ${ownerName}\nTelefone: ${phone}\n\nProduto/Serviço: ${productName}\nPreço: ${productPrice} AOA\nCategoria: ${productCategory}\nDescrição: ${productDesc}\n\nCódigo: ${code}`,
  );

  const handleClose = () => {
    setStep(1);
    setRobot(false);
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

        <div className="px-5 pt-4 pb-28">
          <p className="pb-4 text-xs text-muted-foreground">{steps[step - 1]}</p>

          {/* Step 1: Shop Info */}
          {step === 1 && (
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
                label="Número de WhatsApp"
                placeholder="+244 9__ ___ ___"
                type="tel"
                value={phone}
                onChange={setPhone}
              />

              <button
                onClick={() => setRobot((v) => !v)}
                aria-pressed={robot}
                className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-3.5 text-left"
              >
                <span
                  className={cn(
                    "flex size-[22px] shrink-0 items-center justify-center rounded-[5px] border transition-colors",
                    robot ? "border-primary bg-primary" : "border-muted-soft",
                  )}
                >
                  <Check
                    className={cn(
                      "size-3 text-primary-foreground transition-opacity",
                      robot ? "opacity-100" : "opacity-0",
                    )}
                    strokeWidth={3}
                  />
                </span>
                <span className="flex-1">
                  <span className="block text-[12.5px] font-semibold">
                    Confirmo que não sou um robô
                  </span>
                  <span className="block text-[9.5px] text-muted-soft">
                    MUSA Verify · protegido
                  </span>
                </span>
                <ShieldCheck className="size-6 text-muted-soft" strokeWidth={1.4} />
              </button>

              <Nav>
                <Primary disabled={!step1Valid} onClick={() => setStep(2)}>
                  Continuar →
                </Primary>
              </Nav>
            </div>
          )}

          {/* Step 2: Product/Service Details */}
          {step === 2 && (
            <div className="flex flex-col gap-0.5">
              {/* Type selector */}
              <div className="mb-4 flex gap-2 rounded-xl border border-border bg-card p-1">
                {(["produto", "servico"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setProductType(t)}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-1.5 rounded-[10px] py-2.5 text-[12px] font-semibold transition-all",
                      productType === t
                        ? "bg-primary text-primary-foreground shadow-neon"
                        : "text-muted-foreground",
                    )}
                  >
                    {t === "produto" ? (
                      <Package className="size-3.5" />
                    ) : (
                      <Tag className="size-3.5" />
                    )}
                    {t === "produto" ? "Produto" : "Serviço"}
                  </button>
                ))}
              </div>

              <Field
                label={productType === "produto" ? "Nome do Produto" : "Nome do Serviço"}
                placeholder={
                  productType === "produto"
                    ? "Ex: Vestido Ankara Midi"
                    : "Ex: Tranças Boho + Extensões"
                }
                value={productName}
                onChange={setProductName}
              />

              <Field
                label="Preço (AOA)"
                placeholder="Ex: 25000"
                type="number"
                value={productPrice}
                onChange={setProductPrice}
              />

              {/* Category dropdown */}
              <div className="mb-4">
                <label className="mb-1.5 block text-[11px] font-bold tracking-[0.04em] text-muted-foreground uppercase">
                  Categoria
                </label>
                <div className="relative">
                  <button
                    onClick={() => setCatOpen((v) => !v)}
                    className="flex w-full items-center justify-between rounded-xl border border-border bg-card px-3.5 py-3 text-[13px] text-left outline-none focus:border-primary"
                  >
                    <span className={productCategory ? "text-foreground" : "text-muted-soft"}>
                      {productCategory || "Selecione uma categoria"}
                    </span>
                    <ChevronDown
                      className={cn("size-4 text-muted-foreground transition-transform", catOpen && "rotate-180")}
                    />
                  </button>
                  {catOpen && (
                    <div className="absolute z-10 mt-1 w-full rounded-xl border border-border bg-card shadow-soft">
                      {categories.map((c) => (
                        <button
                          key={c}
                          onClick={() => {
                            setProductCategory(c);
                            setCatOpen(false);
                          }}
                          className={cn(
                            "flex w-full items-center px-3.5 py-2.5 text-[12.5px] transition-colors hover:bg-secondary",
                            productCategory === c && "text-primary font-semibold",
                          )}
                        >
                          {productCategory === c && (
                            <Check className="mr-2 size-3 text-primary" strokeWidth={2.5} />
                          )}
                          {c}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="mb-4">
                <label className="mb-1.5 block text-[11px] font-bold tracking-[0.04em] text-muted-foreground uppercase">
                  Descrição (opcional)
                  <textarea
                    value={productDesc}
                    onChange={(e) => setProductDesc(e.target.value)}
                    placeholder="Descreva o produto ou serviço..."
                    rows={3}
                    className="mt-1.5 w-full resize-none rounded-xl border border-border bg-card px-3.5 py-3 text-[13px] font-normal tracking-normal text-foreground normal-case outline-none placeholder:text-muted-soft focus:border-primary"
                  />
                </label>
              </div>

              <div className="rounded-xl border border-dashed border-success/50 bg-success/5 p-3 text-center">
                <p className="flex items-center justify-center gap-1.5 text-[11px] text-success font-medium">
                  <Check className="size-3.5" strokeWidth={2.5} />
                  Publicação gratuita — sem custos, sem planos
                </p>
              </div>

              <Nav>
                <Secondary onClick={() => setStep(1)}>Voltar</Secondary>
                <Primary disabled={!step2Valid} onClick={() => setStep(3)}>
                  Publicar →
                </Primary>
              </Nav>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {step === 3 && (
            <div>
              {/* Summary card */}
              <div className="ink-panel rounded-2xl p-5 mb-4">
                <p className="text-[10px] uppercase tracking-[0.08em] opacity-60 mb-3">
                  Resumo da publicação
                </p>
                {[
                  ["Loja", shopName],
                  ["Titular", ownerName],
                  ["WhatsApp", phone],
                  [productType === "produto" ? "Produto" : "Serviço", productName],
                  ["Preço", `${parseInt(productPrice || "0").toLocaleString("pt-AO")} AOA`],
                  ["Categoria", productCategory],
                ].map(([k, v], i, arr) => (
                  <div
                    key={k}
                    className={cn(
                      "flex justify-between py-2 text-xs",
                      i < arr.length - 1 && "border-b border-white/10",
                    )}
                  >
                    <span className="opacity-70">{k}</span>
                    <span className="font-mono text-right max-w-[55%] truncate">{v}</span>
                  </div>
                ))}
                <div className="mt-3.5 rounded-xl border border-dashed border-primary/60 bg-primary/10 p-3 text-center">
                  <p className="text-[10px] tracking-[0.05em] uppercase opacity-70">
                    Código de referência
                  </p>
                  <p className="mt-1 font-mono text-[17px] tracking-[0.05em] text-primary">
                    {code}
                  </p>
                </div>
              </div>

              <p className="mb-4 text-[12.5px] leading-relaxed text-muted-foreground">
                Clique no botão abaixo para enviar os dados pelo WhatsApp. A sua publicação será
                aprovada e estará <strong>visível gratuitamente</strong> na MUSA em até 24 horas.
              </p>

              <a
                href={`https://wa.me/244900000000?text=${whatsappMsg}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-success py-4 text-[13px] font-bold text-success-foreground"
              >
                <MessageCircle className="size-4" />
                Enviar pelo WhatsApp para publicar
              </a>

              <p className="mt-3.5 rounded-xl border border-border-soft bg-card p-3 text-[11.5px] leading-relaxed text-muted-foreground">
                ✅ Publicação <b>completamente gratuita</b>. Após aprovação, o seu produto/serviço
                aparecerá para todos os clientes da MUSA em Luanda.
              </p>

              <Nav>
                <Secondary onClick={() => setStep(2)}>Voltar</Secondary>
                <Primary onClick={handleClose}>Concluir</Primary>
              </Nav>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  placeholder,
  type = "text",
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="mb-4">
      <label className="mb-1.5 block text-[11px] font-bold tracking-[0.04em] text-muted-foreground uppercase">
        {label}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-border bg-card px-3.5 py-3 text-[13px] font-normal tracking-normal text-foreground normal-case outline-none placeholder:text-muted-soft focus:border-primary"
        />
      </label>
    </div>
  );
}

function Nav({ children }: { children: React.ReactNode }) {
  return <div className="mt-6 flex gap-2.5">{children}</div>;
}

function Primary({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex-1 rounded-[13px] bg-primary py-3.5 text-[12.5px] font-bold text-primary-foreground shadow-neon transition-transform active:scale-[0.98] disabled:opacity-40 disabled:shadow-none"
    >
      {children}
    </button>
  );
}

function Secondary({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex-1 rounded-[13px] border border-border py-3.5 text-[12.5px] font-bold"
    >
      {children}
    </button>
  );
}
