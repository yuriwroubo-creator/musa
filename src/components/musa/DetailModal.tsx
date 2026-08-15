import { X, ChevronLeft, Heart, MessageCircle, MapPin, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";

interface DetailModalProps {
  open: boolean;
  onClose: () => void;
  item: {
    name?: string;
    title?: string;
    description?: string;
    price?: number | string;
    category?: string;
    store?: string;
    store_name?: string;
    phone?: string;
    vendor_phone?: string;
    whatsapp?: string;
    images?: string[];
    media_urls?: string[];
    img?: string;
    rating?: string;
  };
}

function formatPrice(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return `${value.toLocaleString("pt-AO")} Kz`;
  }
  if (typeof value === "string" && value.trim()) return value;
  return "Preço sob consulta";
}

export function DetailModal({ open, onClose, item }: DetailModalProps) {
  const images = item.images || item.media_urls || (item.img ? [item.img] : []);
  const whatsappNumber = item.whatsapp || item.vendor_phone || item.phone;

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

  const handleWhatsApp = () => {
    if (!whatsappNumber) {
      alert("Número de WhatsApp não disponível.");
      return;
    }
    const message = `Olá! Gostaria de saber mais sobre: ${item.name || item.title}`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${whatsappNumber.replace(/\D/g, "")}?text=${encodedMessage}`, "_blank");
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex w-full max-w-2xl max-h-[85dvh] flex-col rounded-2xl border border-white/10 bg-[#1a1a2e] text-white shadow-[0_30px_80px_rgba(0,0,0,.5)] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 shrink-0">
              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="flex size-8 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                  aria-label="Voltar"
                >
                  <ChevronLeft className="size-5" />
                </button>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-white/60">
                    {item.category || "Detalhes"}
                  </p>
                  <h2 className="text-lg font-bold">{item.name || item.title}</h2>
                </div>
              </div>
              <button
                onClick={onClose}
                className="flex size-8 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                aria-label="Fechar"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Image Gallery */}
              {images.length > 0 && (
                <div className="space-y-3">
                  <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-white/5">
                    <img
                      src={images[0]}
                      alt={item.name || item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {images.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {images.slice(1).map((img, index) => (
                        <div
                          key={index}
                          className="flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden bg-white/5"
                        >
                          <img
                            src={img}
                            alt={`${item.name || item.title} ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Info */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-white/60">
                      {item.store_name || item.store || "Loja MUSA"}
                    </p>
                    <p className="text-2xl font-bold text-[#FF5BA3]">
                      {formatPrice(item.price)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-[#FF5BA3]">
                    <Star className="size-4 fill-current" />
                    <span className="text-sm font-semibold">{item.rating || "Novo"}</span>
                  </div>
                </div>

                {item.description && (
                  <div>
                    <h3 className="text-sm font-bold mb-2 text-white">Descrição</h3>
                    <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">
                      {item.description}
                    </p>
                  </div>
                )}

                {/* Contact Info */}
                <div className="flex items-center gap-3 rounded-xl bg-white/5 p-4">
                  <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-[#FF2D78] to-[#FF5BA3] text-white">
                    <MessageCircle className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Contato</p>
                    <p className="text-xs text-white/60">
                      {whatsappNumber || "Disponível no WhatsApp"}
                    </p>
                  </div>
                  <button
                    onClick={handleWhatsApp}
                    className="ml-auto flex items-center gap-2 rounded-full bg-gradient-to-r from-[#FF2D78] to-[#FF5BA3] px-4 py-2 text-xs font-bold text-white shadow-[0_4px_16px_rgba(255,45,120,.3)] hover:shadow-[0_6px_20px_rgba(255,45,120,.4)] transition-all"
                  >
                    <MessageCircle className="size-4" />
                    WhatsApp
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
