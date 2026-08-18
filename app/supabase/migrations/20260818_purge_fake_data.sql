-- =============================================================
-- MUSA Migration: Purge Fake Test Data
-- Cleans up test products, services, and reels while keeping schema & RLS intact.
-- =============================================================

BEGIN;

-- 1. Remove products/services with test or placeholder titles/descriptions if needed,
-- or truncate/delete rows created during development tests.
-- (Adjust conditions as needed or delete rows where vendor_id is test/null or titles contain test keywords)
DELETE FROM public.products 
WHERE name ILIKE '%teste%' 
   OR description ILIKE '%teste%' 
   OR name ILIKE '%dummy%';

DELETE FROM public.services 
WHERE name ILIKE '%teste%' 
   OR description ILIKE '%teste%' 
   OR name ILIKE '%dummy%';

-- 2. Optional: Clean up orphaned post comments or test records
DELETE FROM public.post_comments 
WHERE comment ILIKE '%teste%' 
   OR comment ILIKE '%dummy%';

COMMIT;
