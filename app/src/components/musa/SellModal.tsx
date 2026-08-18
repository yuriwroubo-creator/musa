import { AnimatePresence, motion } from "framer-motion";
import { Camera, Package, Scissors, X } from "lucide-react";
import { toast } from "sonner";

export function SellModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-end justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            aria-label="Fechar"
            onClick={onClose}
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 26, stiffness: 260 }}
            className="glass-panel relative w-full max-w-md rounded-t-4xl px-5 pt-5 safe-bottom"
          >
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-border" />
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar"
              className="absolute right-3 top-3 flex min-h-[44px] min-w-[44px] items-center justify-center text-muted-foreground"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="display text-2xl">Publicar na MUSA</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Escolhe o que queres colocar à venda hoje.
            </p>
            <div className="mt-5 space-y-2.5 pb-5">
              {[
                {
                  icon: Package,
                  title: "Produto",
                  desc: "Beleza, moda ou acessórios com stock",
                },
                {
                  icon: Scissors,
                  title: "Serviço",
                  desc: "Cabelo, unhas, maquilhagem com marcação",
                },
                {
                  icon: Camera,
                  title: "Reel",
                  desc: "Vídeo curto ligado a um dos teus artigos",
                },
              ].map(({ icon: Icon, title, desc }) => (
                <button
                  key={title}
                  type="button"
                  onClick={() => {
                    onClose();
                    toast(`${title} — em breve`, {
                      description: "Vais poder publicar directamente da app.",
                    });
                  }}
                  className="flex w-full min-h-[44px] items-center gap-3 rounded-2xl border border-border-soft bg-card p-3 text-left transition-transform active:scale-[0.98]"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-wash text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold">{title}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {desc}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
