-- =============================================================
-- MUSA: onboarding da loja e foto pública da marca
-- Guarda a fotografia pública da loja junto da subscrição do vendedor.
-- =============================================================

ALTER TABLE public.vendor_subscriptions
  ADD COLUMN IF NOT EXISTS store_photo_url TEXT;
