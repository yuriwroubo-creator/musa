-- =============================================================
-- MUSA Creator Platform -- Migracao 00004
-- Corre este ficheiro no SQL Editor do teu painel Supabase
-- =============================================================

-- 1. Adicionar coluna de media (fotos/videos) às tabelas de produtos e servicos
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS media_urls TEXT[] DEFAULT '{}';
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS media_urls TEXT[] DEFAULT '{}';

-- 2. Tabela de Notificacoes
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    read BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_read_idx ON public.notifications(read, user_id);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notif_select_own"
    ON public.notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "notif_update_own"
    ON public.notifications FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "notif_insert_system"
    ON public.notifications FOR INSERT
    WITH CHECK (true);

-- 3. Tabela de Visualizacoes de Produtos
CREATE TABLE IF NOT EXISTS public.product_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    service_id UUID REFERENCES public.services(id) ON DELETE CASCADE,
    viewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS product_views_product_id_idx ON public.product_views(product_id);
CREATE INDEX IF NOT EXISTS product_views_service_id_idx ON public.product_views(service_id);

ALTER TABLE public.product_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "views_insert_anyone"
    ON public.product_views FOR INSERT
    WITH CHECK (true);

CREATE POLICY "views_select_anyone"
    ON public.product_views FOR SELECT
    USING (true);

-- 4. Funcao de notificacao quando alguem da follow
CREATE OR REPLACE FUNCTION public.notify_on_follow()
RETURNS TRIGGER AS $$
DECLARE
    vendor_user_id UUID;
    follower_name TEXT;
BEGIN
    SELECT user_id INTO vendor_user_id
    FROM public.vendor_subscriptions
    WHERE id = NEW.following_id;

    SELECT COALESCE(full_name, 'Alguem') INTO follower_name
    FROM public.profiles
    WHERE id = NEW.follower_id;

    IF vendor_user_id IS NOT NULL THEN
        INSERT INTO public.notifications (user_id, type, title, message, metadata)
        VALUES (
            vendor_user_id,
            'new_follower',
            'Nova Seguidora!',
            follower_name || ' comecou a seguir a tua loja.',
            jsonb_build_object('follower_id', NEW.follower_id, 'following_id', NEW.following_id)
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_on_follow ON public.follows;
CREATE TRIGGER trigger_notify_on_follow
    AFTER INSERT ON public.follows
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_on_follow();

-- =============================================================
-- DEPOIS DE CORRER ESTE SQL:
-- Va a Storage > Buckets > New Bucket
-- Name: musa-media
-- Public bucket: SIM
-- =============================================================
