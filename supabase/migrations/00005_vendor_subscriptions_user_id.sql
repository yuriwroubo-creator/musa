-- =============================================================
-- MUSA: alinhar vendor_subscriptions com a lógica da app
-- Corrige a relação entre utilizador autenticado e loja.
-- =============================================================

ALTER TABLE public.vendor_subscriptions
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS vendor_subscriptions_user_id_idx
  ON public.vendor_subscriptions(user_id);

-- Garantir que a publicação continua a funcionar mesmo com registos antigos.
-- Os vendedores já criados podem manter user_id nulo até serem atualizados.
