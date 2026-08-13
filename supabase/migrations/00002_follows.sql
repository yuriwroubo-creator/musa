-- Criação da tabela de follows
CREATE TABLE IF NOT EXISTS public.follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES public.vendor_subscriptions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (follower_id, following_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON public.follows(following_id);

-- Activar RLS
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- 1. Leitura pública (para podermos fazer count de seguidores sem estar logado)
CREATE POLICY "Leitura publica de follows" ON public.follows
    FOR SELECT USING (true);

-- 2. Inserção apenas para o próprio utilizador
CREATE POLICY "Utilizadores podem seguir" ON public.follows
    FOR INSERT WITH CHECK (auth.uid() = follower_id);

-- 3. Remoção apenas para o próprio utilizador
CREATE POLICY "Utilizadores podem deixar de seguir" ON public.follows
    FOR DELETE USING (auth.uid() = follower_id);
