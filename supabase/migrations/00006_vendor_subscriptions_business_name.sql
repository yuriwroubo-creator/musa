-- =============================================================
-- MUSA: garantir compatibilidade com o campo business_name
-- Mantém a publicação e a listagem de lojas alinhadas com o frontend.
-- =============================================================

ALTER TABLE public.vendor_subscriptions
  ADD COLUMN IF NOT EXISTS business_name TEXT;

CREATE INDEX IF NOT EXISTS vendor_subscriptions_business_name_idx
  ON public.vendor_subscriptions(business_name);
