-- MUSA: garantir compatibilidade com o campo phone
-- O telefone é útil para contacto, mas deve permanecer opcional para publicação.
-- =============================================================

ALTER TABLE public.vendor_subscriptions
  ADD COLUMN IF NOT EXISTS phone TEXT;
