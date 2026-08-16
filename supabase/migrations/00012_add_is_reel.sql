-- Isolamento de conteúdo: Reels vs feed normal
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_reel BOOLEAN DEFAULT false;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS is_reel BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS products_is_reel_idx ON public.products(is_reel) WHERE is_reel = true;
CREATE INDEX IF NOT EXISTS services_is_reel_idx ON public.services(is_reel) WHERE is_reel = true;
