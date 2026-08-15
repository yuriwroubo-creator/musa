/**
 * Public (publishable) configuration for the Musa platform.
 * Only publishable keys belong here — private tokens live in server secrets.
 */
const env = import.meta.env as Record<string, string | undefined>;

export const SUPABASE_URL =
  env["VITE_SUPABASE_URL"] ?? "https://mozrlbmchwuggjauewoo.supabase.co";
export const SUPABASE_ANON_KEY =
  env["VITE_SUPABASE_ANON_KEY"] ?? "sb_publishable_zVnmI_eqnA76-FqMZ6m0pg_Cr-BCdKN";

export const TURNSTILE_SITE_KEY =
  env["VITE_TURNSTILE_SITE_KEY"] ?? "0x4AAAAAAEQs8bt1rI3awIxm";

export const ALGOLIA_APP_ID = env["VITE_ALGOLIA_APP_ID"] ?? "FR7426VGXG";
export const ALGOLIA_SEARCH_KEY =
  env["VITE_ALGOLIA_SEARCH_KEY"] ?? "ac919ba074bc35e7b56171a544497abe";
export const ALGOLIA_PRODUCTS_INDEX = "products";
export const ALGOLIA_SERVICES_INDEX = "services";

/** Where Google OAuth returns the user after sign-in. Set VITE_SITE_URL in Vercel env. */
export const OAUTH_REDIRECT_URL = env["VITE_SITE_URL"] ?? "";