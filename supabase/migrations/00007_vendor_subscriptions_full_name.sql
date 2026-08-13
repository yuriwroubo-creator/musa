-- MUSA: garantir compatibilidade com o campo full_name
-- A criação/publicação de loja envia o nome da proprietária para esta coluna.
-- Sem ela, o PostgREST/Supabase pode devolver erro de schema cache.
-- =============================================================

ALTER TABLE public.vendor_subscriptions
  ADD COLUMN IF NOT EXISTS full_name TEXT;
