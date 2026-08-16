import { X, ShoppingBag, Clapperboard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface PublishActionSheetProps {
  open: boolean;
  onClose: () => void;
  onPublishSite: () => void;
  onPublishReel: () => void;
}

export function PublishActionSheet({ open, onClose, onPublishSite, onPublishReel }: PublishActionSheetProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Action Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 z-[125] mx-auto max-w-md max-h-[85dvh] overflow-hidden rounded-t-3xl border-t border-gray-200/50 bg-white/90 shadow-2xl backdrop-blur-md"
          >
            <div className="flex flex-col p-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Onde queres publicar?</h3>
                <button
                  onClick={onClose}
                  className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Options */}
              <div className="max-h-[calc(85dvh-7rem)] space-y-3 overflow-y-auto pr-1">
                <button
                  onClick={() => {
                    onPublishSite();
                    onClose();
                  }}
                  className="flex min-h-[44px] w-full items-center gap-4 rounded-2xl border border-border-soft bg-secondary/50 p-4 hover:bg-secondary transition-colors active:scale-98"
                >
                  <div className="flex size-12 items-center justify-center rounded-full bg-primary text-white">
                    <ShoppingBag className="size-6" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold">Publicar no Site</p>
                    <p className="text-sm text-muted-foreground">Para aba Início e perfil da loja</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    onPublishReel();
                    onClose();
                  }}
                  className="flex min-h-[44px] w-full items-center gap-4 rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 to-accent/10 p-4 hover:from-primary/20 hover:to-accent/20 transition-colors active:scale-98"
                >
                  <div className="flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-white">
                    <Clapperboard className="size-6" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold">Publicar no Reels</p>
                    <p className="text-sm text-muted-foreground">Conteúdo vertical estilo TikTok</p>
                  </div>
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
