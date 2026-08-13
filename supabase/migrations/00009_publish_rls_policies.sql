-- =============================================================
-- MUSA: politicas RLS para publicacao direta
-- Permite publicar quando a loja pertence ao utilizador autenticado.
-- =============================================================

ALTER TABLE public.vendor_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Vendor can insert products" ON public.products;
DROP POLICY IF EXISTS "Vendor can insert services" ON public.services;
DROP POLICY IF EXISTS "Vendor can insert vendor_subscriptions" ON public.vendor_subscriptions;

DROP POLICY IF EXISTS "musa_products_select_public" ON public.products;
DROP POLICY IF EXISTS "musa_products_insert_own_vendor" ON public.products;
DROP POLICY IF EXISTS "musa_products_update_own_vendor" ON public.products;
DROP POLICY IF EXISTS "musa_products_delete_own_vendor" ON public.products;

DROP POLICY IF EXISTS "musa_services_select_public" ON public.services;
DROP POLICY IF EXISTS "musa_services_insert_own_vendor" ON public.services;
DROP POLICY IF EXISTS "musa_services_update_own_vendor" ON public.services;
DROP POLICY IF EXISTS "musa_services_delete_own_vendor" ON public.services;

DROP POLICY IF EXISTS "musa_vendors_select_public" ON public.vendor_subscriptions;
DROP POLICY IF EXISTS "musa_vendors_insert_own" ON public.vendor_subscriptions;
DROP POLICY IF EXISTS "musa_vendors_update_own" ON public.vendor_subscriptions;

CREATE POLICY "musa_vendors_select_public"
  ON public.vendor_subscriptions
  FOR SELECT
  USING (true);

CREATE POLICY "musa_vendors_insert_own"
  ON public.vendor_subscriptions
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND (user_id = auth.uid() OR vendor_id = auth.uid())
  );

CREATE POLICY "musa_vendors_update_own"
  ON public.vendor_subscriptions
  FOR UPDATE
  USING (user_id = auth.uid() OR vendor_id = auth.uid())
  WITH CHECK (user_id = auth.uid() OR vendor_id = auth.uid());

CREATE POLICY "musa_products_select_public"
  ON public.products
  FOR SELECT
  USING (true);

CREATE POLICY "musa_products_insert_own_vendor"
  ON public.products
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1
      FROM public.vendor_subscriptions v
      WHERE v.id = products.vendor_id
        AND (v.user_id = auth.uid() OR v.vendor_id = auth.uid())
    )
  );

CREATE POLICY "musa_products_update_own_vendor"
  ON public.products
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.vendor_subscriptions v
      WHERE v.id = products.vendor_id
        AND (v.user_id = auth.uid() OR v.vendor_id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.vendor_subscriptions v
      WHERE v.id = products.vendor_id
        AND (v.user_id = auth.uid() OR v.vendor_id = auth.uid())
    )
  );

CREATE POLICY "musa_products_delete_own_vendor"
  ON public.products
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.vendor_subscriptions v
      WHERE v.id = products.vendor_id
        AND (v.user_id = auth.uid() OR v.vendor_id = auth.uid())
    )
  );

CREATE POLICY "musa_services_select_public"
  ON public.services
  FOR SELECT
  USING (true);

CREATE POLICY "musa_services_insert_own_vendor"
  ON public.services
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1
      FROM public.vendor_subscriptions v
      WHERE v.id = services.vendor_id
        AND (v.user_id = auth.uid() OR v.vendor_id = auth.uid())
    )
  );

CREATE POLICY "musa_services_update_own_vendor"
  ON public.services
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.vendor_subscriptions v
      WHERE v.id = services.vendor_id
        AND (v.user_id = auth.uid() OR v.vendor_id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.vendor_subscriptions v
      WHERE v.id = services.vendor_id
        AND (v.user_id = auth.uid() OR v.vendor_id = auth.uid())
    )
  );

CREATE POLICY "musa_services_delete_own_vendor"
  ON public.services
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.vendor_subscriptions v
      WHERE v.id = services.vendor_id
        AND (v.user_id = auth.uid() OR v.vendor_id = auth.uid())
    )
  );

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'musa-media',
  'musa-media',
  true,
  52428800,
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif',
    'video/mp4',
    'video/quicktime',
    'video/x-m4v',
    'audio/mpeg',
    'audio/wav',
    'audio/aac',
    'audio/mp4'
  ]
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "musa_media_select_public" ON storage.objects;
DROP POLICY IF EXISTS "musa_media_insert_own_folder" ON storage.objects;
DROP POLICY IF EXISTS "musa_media_update_own_folder" ON storage.objects;
DROP POLICY IF EXISTS "musa_media_delete_own_folder" ON storage.objects;

CREATE POLICY "musa_media_select_public"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'musa-media');

CREATE POLICY "musa_media_insert_own_folder"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'musa-media'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "musa_media_update_own_folder"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'musa-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'musa-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "musa_media_delete_own_folder"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'musa-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
