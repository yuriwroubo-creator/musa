-- =============================================================
-- MUSA: corrigir chave estrangeira das publicacoes
-- products.vendor_id e services.vendor_id devem apontar para a loja.
-- =============================================================

UPDATE public.products p
SET vendor_id = v.id
FROM public.vendor_subscriptions v
WHERE p.vendor_id IN (v.user_id, v.vendor_id)
  AND p.vendor_id <> v.id;

UPDATE public.services s
SET vendor_id = v.id
FROM public.vendor_subscriptions v
WHERE s.vendor_id IN (v.user_id, v.vendor_id)
  AND s.vendor_id <> v.id;

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_vendor_id_fkey;

ALTER TABLE public.services
  DROP CONSTRAINT IF EXISTS services_vendor_id_fkey;

ALTER TABLE public.products
  ADD CONSTRAINT products_vendor_id_fkey
  FOREIGN KEY (vendor_id)
  REFERENCES public.vendor_subscriptions(id)
  ON DELETE CASCADE
  NOT VALID;

ALTER TABLE public.services
  ADD CONSTRAINT services_vendor_id_fkey
  FOREIGN KEY (vendor_id)
  REFERENCES public.vendor_subscriptions(id)
  ON DELETE CASCADE
  NOT VALID;

DROP POLICY IF EXISTS "musa_products_insert_own_vendor" ON public.products;
DROP POLICY IF EXISTS "musa_products_update_own_vendor" ON public.products;
DROP POLICY IF EXISTS "musa_products_delete_own_vendor" ON public.products;

DROP POLICY IF EXISTS "musa_services_insert_own_vendor" ON public.services;
DROP POLICY IF EXISTS "musa_services_update_own_vendor" ON public.services;
DROP POLICY IF EXISTS "musa_services_delete_own_vendor" ON public.services;

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
