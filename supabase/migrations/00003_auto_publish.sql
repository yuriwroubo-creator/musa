-- Adicionar coluna de moderação para o AI Fail-Safe
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS flagged_for_review BOOLEAN DEFAULT false;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS flagged_for_review BOOLEAN DEFAULT false;

-- Permitir inserção autenticada nas tabelas (se ainda não existir, depende do setup atual do RLS)
-- Assume-se que a inserção na tabela products/services pode necessitar de RLS para insert autenticado
CREATE POLICY "Vendor can insert products" ON public.products
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Vendor can insert services" ON public.services
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Vendor can insert vendor_subscriptions" ON public.vendor_subscriptions
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
