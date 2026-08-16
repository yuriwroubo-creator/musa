-- Migration: create post_comments table for public post comments

BEGIN;

CREATE TABLE IF NOT EXISTS post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL,
  post_type text NOT NULL CHECK (post_type IN ('product','service')),
  user_id uuid NOT NULL,
  comment text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- optional foreign keys if profiles & products/services use those ids
-- ALTER TABLE post_comments ADD CONSTRAINT fk_post_comments_user_profiles FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

COMMIT;
