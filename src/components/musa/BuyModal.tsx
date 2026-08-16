import { useState, useEffect } from "react";
import { X, ShoppingCart, MessageCircle, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface VariantOption {
  id: string;
  name: string;
  price?: number;
}

interface VariantGroup {
  name: string;
  options: VariantOption[];
  required: boolean;
}

interface BuyModalProps {
  open: boolean;
  onClose: () => void;
  product: {
    name: string;
    price: number | string;
    category: string;
    store: string;
    whatsapp?: string;
    vendor_phone?: string;
    phone?: string;
    variants?: any[] | null;
  };
}

// Category-based variant configurations
const categoryVariants: Record<string, VariantGroup[]> = {
  "Roupas & Moda": [
    {
      name: "Tamanho",
      required: true,
      options: [
        { id: "xs", name: "XS" },
        { id: "s", name: "S" },
        { id: "m", name: "M" },
        { id: "l", name: "L" },
        { id: "xl", name: "XL" },
        { id: "xxl", name: "XXL" },
      ],
    },
    {
      name: "Cor",
      required: true,
      options: [
        { id: "black", name: "Preto" },
        { id: "white", name: "Branco" },
        { id: "red", name: "Vermelho" },
        { id: "blue", name: "Azul" },
        { id: "pink", name: "Rosa" },
        { id: "gold", name: "Dourado" },
        { id: "other", name: "Outro" },
      ],
    },
  ],
  "Cabelos & Laces": [
    {
      name: "Comprimento",
      required: true,
      options: [
        { id: "short", name: "Curto (10-12cm)" },
        { id: "medium", name: "Médio (14-16cm)" },
        { id: "long", name: "Longo (18-20cm)" },
        { id: "extra_long", name: "Extra Longo (22cm+)" },
      ],
    },
    {
      name: "Textura",
      required: true,
      options: [
        { id: "straight", name: "Liso" },
        { id: "wavy", name: "Ondulado" },
        { id: "curly", name: "Cacheado" },
        { id: "kinky", name: "Kinky" },
      ],
    },
  ],
  "Doces & Catering": [
    {
      name: "Quantidade",
      required: true,
      options: [
        { id: "1", name: "1 unidade" },
        { id: "6", name: "6 unidades" },
        { id: "12", name: "12 unidades" },
        { id: "24", name: "24 unidades" },
      ],
    },
    {
      name: "Sabor",
      required: true,
      options: [
        { id: "chocolate", name: "Chocolate" },
        { id: "vanilla", name: "Baunilha" },
        { id: "strawberry", name: "Morango" },
        { id: "mixed", name: "Misto" },
      ],
    },
  ],
  "Beats & Áudio": [
    {
      name: "Licença",
      required: true,
      options: [
        { id: "exclusive", name: "Exclusiva", price: 50000 },
        { id: "lease", name: "Lease", price: 10000 },
        { id: "free", name: "Gratuito", price: 0 },
      ],
    },
    {
      name: "Formato",
      required: true,
      options: [
        { id: "mp3", name: "MP3" },
        { id: "wav", name: "WAV" },
        { id: "stems", name: "Stems" },
      ],
    },
  ],
};

export function BuyModal({ open, onClose, product }: BuyModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [customNote, setCustomNote] = useState("");

  // Block body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const isService = product.category?.toLowerCase().includes("serviço") || product.category?.toLowerCase().includes("servico");
  const isFood = product.category?.toLowerCase().includes("doces") || product.category?.toLowerCase().includes("catering") || product.category?.toLowerCase().includes("comida");
  const isFashion = product.category?.toLowerCase().includes("roupas") || product.category?.toLowerCase().includes("moda") || product.category?.toLowerCase().includes("vestuário");
  const isHair = product.category?.toLowerCase().includes("cabelos") || product.category?.toLowerCase().includes("laces");

  const variants = product.variants && product.variants.length > 0 
    ? product.variants.map((v: any) => ({
        name: v.name || "Opção",
        required: true,
        options: v.options?.map((o: any) => ({
          id: o.id || o.value,
          name: o.name || o.value,
          price: o.price || 0,
        })) || [],
      }))
    : isFood
      ? [
          {
            name: "Quantidade",
            required: true,
            options: [
              { id: "1", name: "1 unidade" },
              { id: "6", name: "6 unidades" },
              { id: "12", name: "12 unidades" },
              { id: "24", name: "24 unidades" },
            ],
          },
          {
            name: "Sabor",
            required: true,
            options: [
              { id: "chocolate", name: "Chocolate" },
              { id: "baunilha", name: "Baunilha" },
              { id: "morango", name: "Morango" },
              { id: "misto", name: "Misto" },
            ],
          },
        ]
      : isFashion
      ? [
          {
            name: "Tamanho",
            required: true,
            options: [
              { id: "xs", name: "XS" },
              { id: "s", name: "S" },
              { id: "m", name: "M" },
              { id: "l", name: "L" },
              { id: "xl", name: "XL" },
              { id: "xxl", name: "XXL" },
            ],
          },
          {
            name: "Cor",
            required: true,
            options: [
              { id: "preto", name: "Preto" },
              { id: "branco", name: "Branco" },
              { id: "vermelho", name: "Vermelho" },
              { id: "azul", name: "Azul" },
              { id: "rosa", name: "Rosa" },
              { id: "dourado", name: "Dourado" },
              { id: "outro", name: "Outro" },
            ],
          },
        ]
      : isHair
      ? [
          {
            name: "Comprimento",
            required: true,
            options: [
              { id: "curto", name: "Curto (10-12cm)" },
              { id: "medio", name: "Médio (14-16cm)" },
              { id: "longo", name: "Longo (18-20cm)" },
              { id: "extra", name: "Extra Longo (22cm+)" },
            ],
          },
          {
            name: "Textura",
            required: true,
            options: [
              { id: "liso", name: "Liso" },
              { id: "ondulado", name: "Ondulado" },
              { id: "cacheado", name: "Cacheado" },
              { id: "kinky", name: "Kinky" },
            ],
          },
        ]
      : [
          {
            name: "Quantidade",
            required: true,
            options: [
              { id: "1", name: "1 unidade" },
              { id: "2", name: "2 unidades" },
              { id: "3", name: "3 unidades" },
            ],
          },
        ];

  const basePrice = typeof product.price === 'number' ? product.price : 
    parseFloat(String(product.price).replace(/\D/g, '')) || 0;

  const totalPrice = (basePrice * quantity) + 
    Object.entries(selectedVariants).reduce((acc, [groupId, optionId]) => {
      const group = variants.find(g => g.name === groupId);
      const option = group?.options.find(o => o.id === optionId);
      return acc + (option?.price || 0);
    }, 0);

  const isFormValid = variants.every(group => 
    !group.required || selectedVariants[group.name]
  );

  const handleVariantSelect = (groupName: string, optionId: string) => {
    setSelectedVariants(prev => ({
      ...prev,
      [groupName]: optionId,
    }));
  };

  const formatPrice = (price: number) => {
    return `${price.toLocaleString("pt-AO")} AOA`;
  };

  const handleWhatsAppCheckout = () => {
    const whatsappNumber =
      product.whatsapp ||
      product.vendor_phone ||
      product.phone ||
      product.vendor_subscriptions?.whatsapp ||
      product.vendor_subscriptions?.phone ||
      "";
    if (!whatsappNumber) {
      alert("Número de WhatsApp não disponível para esta loja.");
      return;
    }

    // Build the order summary
    let message = `🛒 *NOVO PEDIDO - MUSA*\n\n`;
    message += `📦 *Produto:* ${product.name}\n`;
    message += `🏪 *Loja:* ${product.store}\n`;
    message += `💰 *Preço Base:* ${formatPrice(basePrice)}\n\n`;
    
    message += `📋 *Detalhes do Pedido:*\n`;
    message += `🔢 *Quantidade:* ${quantity}\n`;
    
    Object.entries(selectedVariants).forEach(([groupName, optionId]) => {
      const group = variants.find(g => g.name === groupName);
      const option = group?.options.find(o => o.id === optionId);
      if (option) {
        message += `✅ *${groupName}:* ${option.name}\n`;
      }
    });
    
    if (customNote.trim()) {
      message += `\n📝 *Nota:* ${customNote.trim()}\n`;
    }
    
    message += `\n💳 *Total:* ${formatPrice(totalPrice)}\n\n`;
    message += `📲 *Enviado via MUSA Marketplace*`;

    const encodedMessage = encodeURIComponent(message);
    const clean = whatsappNumber.replace(/\D/g, "");
    // Prefer official wa.me; fallback to api.whatsapp.com if needed
    const whatsappUrl = `https://wa.me/${clean}?text=${encodedMessage}`;
    const fallback = `https://api.whatsapp.com/send?phone=${clean}&text=${encodedMessage}`;

    // Try opening wa.me and fallback if popup blocked
    const newWin = window.open(whatsappUrl, "_blank");
    if (!newWin) {
      // Popup blocked or failed, try fallback
      window.open(fallback, "_blank");
    }
    onClose();
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-md max-h-[85dvh] flex-col rounded-2xl border border-white/10 bg-[#1a1a2e] text-white shadow-[0_30px_80px_rgba(0,0,0,.5)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 shrink-0">
          <div>
            <h3 className="text-lg font-bold">{isService ? "Agendar Serviço" : "Comprar Produto"}</h3>
            <p className="text-xs text-white/60">{product.name}</p>
          </div>
          <button
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-full bg-secondary transition-colors hover:bg-secondary/80"
            aria-label="Fechar"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Product Info */}
          <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-[#FF2D78] to-[#FF5BA3] text-white">
              <ShoppingCart className="size-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">{product.name}</p>
              <p className="text-xs text-white/60">{product.store}</p>
            </div>
            <p className="ml-auto font-mono text-sm font-bold text-[#FF5BA3]">
              {formatPrice(basePrice)}
            </p>
          </div>

          {/* Quantity */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-white/60">
              Quantidade
            </label>
            <div className="mt-2 flex items-center gap-2">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="flex size-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white transition-colors hover:bg-white/10"
              >
                -
              </button>
              <span className="flex min-w-[40px] items-center justify-center font-mono font-bold text-white">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="flex size-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white transition-colors hover:bg-white/10"
              >
                +
              </button>
            </div>
          </div>

          {/* Dynamic Variants */}
          {variants.map((group) => (
            <div key={group.name}>
              <label className="text-xs font-bold uppercase tracking-wide text-white/60">
                {group.name}
                {group.required && " *"}
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                {group.options.map((option) => {
                  const isSelected = selectedVariants[group.name] === option.id;
                  return (
                    <button
                      key={option.id}
                      onClick={() => handleVariantSelect(group.name, option.id)}
                      className={cn(
                        "rounded-lg border px-3 py-2 text-xs font-bold transition-all",
                        isSelected
                          ? "border-[#FF5BA3] bg-[#FF2D78]/20 text-[#FF5BA3]"
                          : "border-white/10 bg-white/5 text-white/70 hover:border-white/20",
                      )}
                    >
                      {option.name}
                      {option.price && (
                        <span className="ml-1 text-[10px] opacity-75">
                          +{formatPrice(option.price)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Custom Note */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-white/60">
              Personalizar / Especificações
            </label>
            <textarea
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="Detalhes personalizados, observações ou preferências..."
              className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none placeholder:text-white/35 leading-relaxed"
              rows={2}
            />
          </div>

          {/* Total */}
          <div className="flex items-center justify-between rounded-xl bg-white/5 p-3">
            <span className="text-sm font-bold text-white">Total</span>
            <span className="font-mono text-lg font-bold text-[#FF5BA3]">
              {formatPrice(totalPrice)}
            </span>
          </div>
        </div>

        {/* Footer - Sticky */}
        <div className="sticky bottom-0 border-t border-white/10 bg-[#1a1a2e] px-5 py-4 shrink-0">
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 rounded-xl border border-white/10 bg-white/5 py-3 text-xs font-bold text-white/70 transition-colors hover:bg-white/10"
            >
              Cancelar
            </button>
            <button
              onClick={handleWhatsAppCheckout}
              disabled={!isFormValid}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FF2D78] to-[#FF5BA3] py-3 text-xs font-bold text-white transition-all hover:shadow-[0_8px_24px_rgba(255,45,120,.4)] disabled:opacity-50 disabled:shadow-none",
                isFormValid && "shadow-[0_12px_32px_rgba(255,45,120,.5)]",
              )}
            >
              <MessageCircle className="size-4" />
              {isService ? "Agendar via WhatsApp" : "Comprar via WhatsApp"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
