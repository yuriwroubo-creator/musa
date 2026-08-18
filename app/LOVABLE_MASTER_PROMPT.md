# MUSA Official Mobile App — Master Context & Architecture Prompt

> **Purpose:** Build the official MUSA mobile application as a standalone React app that shares the existing Supabase backend with the live web platform. This document is the single source of truth for architecture, design, data contracts, and UX behavior.
>
> **Product:** MUSA — Angola's beauty & fashion marketplace (Luanda). Creators sell products and services; buyers discover via a TikTok-style Reels feed and a conversion-focused store grid.
>
> **Locale:** UI copy in **European Portuguese (pt-PT / pt-AO)**. Currency: **AOA (Kwanza)**. Phone contact via **WhatsApp** is primary conversion channel.

---

## A. Tech Stack

Build a **new mobile-first React application** with:

| Layer | Choice |
|---|---|
| Framework | **React 19** + **Vite** |
| Styling | **Tailwind CSS v4** (CSS-first `@theme` tokens — no legacy `tailwind.config.js`) |
| Animation | **Framer Motion** (`motion`, `AnimatePresence`) |
| Data fetching | **TanStack React Query v5** |
| Routing | **React Router v7** (or TanStack Router — keep file-based routes if possible) |
| Backend | **Supabase JS v2** (`@supabase/supabase-js`) — **reuse existing project** |
| Search (optional) | **Algolia** (products + services indexes already exist) |
| Native wrapper (future) | **Capacitor.js** — structure code so it wraps cleanly |

### Mobile-First Constraints (Strict)

- Design and test at **390×844 viewport** (iPhone 14 baseline). All layouts must work 360–430px wide.
- Use **`100dvh`** for full-screen sections (Reels), not `100vh`.
- Respect **safe areas**: `padding-bottom: env(safe-area-inset-bottom)` on bottom nav and modals.
- Hide scrollbars globally; use snap scrolling where appropriate.
- Disable tap highlight: `-webkit-tap-highlight-color: transparent`.
- All interactive targets: **minimum 44×44px** touch area (Apple HIG).
- Prepare for Capacitor: use `navigator.share`, `navigator.vibrate`, camera/file inputs via standard HTML APIs; avoid desktop-only patterns.

### Project Structure (Suggested)

```
src/
  components/musa/     # Feature components (ReelsFeed, BottomNav, SellModal…)
  components/ui/       # shadcn-style primitives
  hooks/               # useAuth, useFavorites, useFollows, useProducts…
  lib/                 # personalization.ts, supabase client, storage helpers
  routes/              # Home, Reels, Favoritos, Perfil, Store/:id
  styles.css           # Design tokens (copy from web)
integrations/supabase/
  client.ts
```

---

## B. Design System

MUSA's visual identity is **polished feminine commerce**: porcelain backgrounds, ink typography, **rose-neon primary**, **jade accent**, and **warm gold** highlights. Never hardcode hex colors in components — always use semantic CSS variables.

### Typography

Import from Google Fonts:

- **Sans (UI):** `"Plus Jakarta Sans"` — body, labels, buttons
- **Serif (Editorial):** `"Playfair Display"` italic — hero headlines, `.display` utility
- **Mono:** `"IBM Plex Mono"` — serial IDs, metadata

```css
--font-sans: "Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif;
--font-serif: "Playfair Display", serif;
--font-mono: "IBM Plex Mono", ui-monospace, monospace;
```

### Border Radius

Base radius: **`--radius: 1rem`**

Derived tokens: `--radius-sm` through `--radius-4xl` (computed from base).

Common usage:
- Cards / panels: `rounded-2xl` (1rem+)
- Buttons: `rounded-xl` / `rounded-lg`
- Pills / search bars: `rounded-full`
- Publish CTA in bottom nav: `rounded-2xl` with neon shadow

### Color Palette (Light Mode — Primary)

All values are **oklch** semantic tokens defined on `:root`:

| Token | Value | Usage |
|---|---|---|
| `--background` | `oklch(0.985 0.012 85)` | Page background (porcelain) |
| `--foreground` | `oklch(0.17 0.018 315)` | Primary text (ink) |
| `--card` | `oklch(0.998 0.004 85)` | Card surfaces |
| `--primary` | `oklch(0.64 0.24 352)` | Rose neon — CTAs, active nav, likes |
| `--primary-foreground` | `oklch(1 0 0)` | Text on primary buttons |
| `--primary-deep` | `oklch(0.48 0.2 350)` | Hover / pressed states |
| `--primary-wash` | `oklch(0.955 0.045 352)` | Soft pink backgrounds |
| `--secondary` | `oklch(0.955 0.018 115)` | Secondary surfaces |
| `--muted` | `oklch(0.94 0.012 85)` | Muted backgrounds |
| `--muted-foreground` | `oklch(0.46 0.018 315)` | Secondary text |
| `--accent` | `oklch(0.93 0.056 158)` | Jade wash |
| `--accent-foreground` | `oklch(0.34 0.075 158)` | Jade text |
| `--destructive` | `oklch(0.6 0.25 25)` | Errors |
| `--success` | `oklch(0.65 0.15 150)` | Success states |
| `--border` | `oklch(0.875 0.016 85)` | Borders |
| `--border-soft` | `oklch(0.92 0.012 85)` | Subtle borders |
| `--ring` | `oklch(0.64 0.25 350)` | Focus rings |
| `--gold` | `oklch(0.78 0.105 84)` | Premium highlights, shimmer |
| `--jade` | `oklch(0.55 0.105 158)` | Success / nature accent |
| `--neon-shadow` | `oklch(0.64 0.24 352 / 0.34)` | Pink glow |

**Reels-specific accent colors (overlay on black):**
- Like heart fill: `#FF5BA3`
- Buy button gradient: `from-[#FF2D78] to-[#FF5BA3]`
- WhatsApp button: `#25D366` at 80% opacity

### Dark Mode

Support `.dark` class with elegant dark gray (not pitch black). Primary becomes `oklch(0.7 0.22 350)`. Default to **light mode** for marketplace; Reels feed is always **black full-screen**.

### Shadows

```css
--shadow-neon: 0 8px 22px -8px var(--neon-shadow);
--shadow-neon-lg: 0 16px 40px -12px var(--neon-shadow);
--shadow-soft: 0 16px 46px -28px oklch(0.2 0.02 300 / 0.45);
--shadow-luxe: 0 24px 70px -38px oklch(0.2 0.03 300 / 0.5);
```

### Glassmorphism Rules

Use these utility patterns consistently:

**`.glass-panel`**
```css
border: 1px solid color-mix(in oklch, var(--color-border), white 35%);
background: color-mix(in oklch, var(--color-card), transparent 14%);
box-shadow: var(--shadow-soft);
backdrop-filter: blur(24px);
```

**Reels overlay buttons:**
```css
background: rgba(255,255,255,0.20);
backdrop-filter: blur(4px); /* backdrop-blur-sm */
border-radius: 9999px;
```

**Bottom navigation bar:**
```css
border-top: 1px solid rgba(gray, 0.5);
background: rgba(255,255,255,0.80);
backdrop-filter: blur(12px);
box-shadow: 0 -18px 46px -28px rgba(255,45,120,0.28);
```

**Floating search on Reels:**
```css
background: rgba(0,0,0,0.40);
backdrop-filter: blur(12px);
border-radius: 9999px;
```

### Other Utilities

- **`.luxe-card`** — elevated product cards with soft shadow
- **`.neon-text`** — primary color + pink text-shadow glow
- **`.ink-panel`** — dark gradient panel for premium sections
- **`.sheen`** — hover shine animation on publish button
- **`.display`** — Playfair Display italic for editorial headlines
- **Animations:** `musa-float` (gentle bob), `musa-rise` (enter), `musa-sheen` (shine sweep)

### Body Background (Marketplace screens)

Subtle grid + radial pink/gold washes on `--background`. Keep Reels screens pure `#000`.

### Touch & Accessibility

- All buttons: `min-h-[44px] min-w-[44px]`
- Active press feedback: `active:scale-95` or `active:scale-98`
- Focus visible: `outline: 2px solid var(--color-primary); outline-offset: 2px`
- Icon stroke: 1.8 inactive, 2.5 active

---

## C. Backend Connectivity

### Existing Infrastructure (Do NOT recreate)

The Supabase project, storage bucket, and AI keys **already exist**. Connect to them via environment variables:

```env
VITE_SUPABASE_URL=https://mozrlbmchwuggjauewoo.supabase.co
VITE_SUPABASE_ANON_KEY=<existing publishable anon key>
VITE_ALGOLIA_APP_ID=FR7426VGXG
VITE_ALGOLIA_SEARCH_KEY=<existing search-only key>
VITE_ALGOLIA_PRODUCTS_INDEX=products
VITE_ALGOLIA_SERVICES_INDEX=services
```

**Server-side secrets (Edge Functions / server routes — never expose to client):**
```env
GROQ_API_KEY=<for AI moderation + Musa AI chat>
OPENAI_API_KEY=<fallback>
TURNSTILE_SECRET_KEY=<Cloudflare captcha>
```

**Storage bucket:** `musa-media` (public). Max upload: **50MB** per file. Supported: images (jpg, png, webp, heic), video (mp4, mov, m4v), audio (mp3, wav, aac, m4a).

**Auth:** Google OAuth via Supabase Auth. Session persisted in localStorage. Unauthenticated users can browse; auth required for favorites, publish, profile, messages.

### Core Database Schema

> Note: Initial schema was applied manually in Supabase. Below is the **effective schema** inferred from production app usage and migrations.

#### `profiles` (extends `auth.users`)

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | FK → `auth.users(id)` |
| `full_name` | TEXT | Display name |
| `username` | TEXT | URL-safe handle, indexed |
| `avatar_url` | TEXT | Profile photo |
| `store_name` | TEXT | Optional store display name |

#### `vendor_subscriptions` (Creator / Store accounts)

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | Referenced as `vendor_id` on products/services |
| `serial_id` | TEXT | Format: `MUSA-XXXXXX-XXXX` |
| `user_id` | UUID | FK → `auth.users(id)` |
| `business_name` | TEXT | Store name |
| `full_name` | TEXT | Owner legal name |
| `phone` | TEXT | WhatsApp number (required for publish) |
| `email` | TEXT | Optional |
| `store_name` | TEXT | Legacy display name |
| `store_photo_url` | TEXT | Public store avatar |
| `plan` | TEXT | e.g. `basic` |
| `status` | TEXT | e.g. `active` |
| `created_at` | TIMESTAMPTZ | |

#### `products`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `name` | TEXT | Product title |
| `title` | TEXT | Duplicate of name (legacy) |
| `description` | TEXT | |
| `price` | NUMERIC | |
| `price_aoa` | NUMERIC | Angola Kwanza |
| `category` | TEXT | See categories below |
| `image_url` | TEXT | Primary image |
| `vendor_id` | UUID FK | → `vendor_subscriptions(id)` |
| `media_urls` | TEXT[] | Array of storage URLs (images/video/audio) |
| `is_reel` | BOOLEAN | `true` = appears in Reels feed |
| `flagged_for_review` | BOOLEAN | AI moderation flag |
| `created_at` | TIMESTAMPTZ | |

#### `services`

Same structure as `products`, plus:
| Column | Type | Notes |
|---|---|---|
| `home` | BOOLEAN | Home service available |

#### `follows`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `follower_id` | UUID FK | → `profiles(id)` |
| `following_id` | UUID FK | → `vendor_subscriptions(id)` |
| `created_at` | TIMESTAMPTZ | UNIQUE(follower_id, following_id) |

#### `favorites`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `user_id` | UUID FK | → `auth.users(id)` |
| `item_id` | UUID | Product or service ID |
| `item_type` | TEXT | `'product'` \| `'service'` |
| `created_at` | TIMESTAMPTZ | |

#### `post_comments`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `post_id` | UUID | Product or service ID |
| `post_type` | TEXT | `'product'` \| `'service'` |
| `user_id` | UUID | Comment author |
| `comment` | TEXT | |
| `created_at` | TIMESTAMPTZ | |

#### `notifications`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `user_id` | UUID FK | Recipient |
| `type` | TEXT | e.g. `new_follower` |
| `title` | TEXT | |
| `message` | TEXT | |
| `read` | BOOLEAN | Default false |
| `metadata` | JSONB | |
| `created_at` | TIMESTAMPTZ | |

#### `product_views`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `product_id` | UUID | Nullable |
| `service_id` | UUID | Nullable |
| `viewer_id` | UUID | Nullable (anonymous OK) |
| `viewed_at` | TIMESTAMPTZ | |

#### `conversations` + `messages` (In-app chat)

**conversations:** `id`, `participant_a` (UUID), `participant_b` (UUID), `created_at`

**messages:** `id`, `conversation_id`, `sender_id`, `content`, `created_at` (+ realtime via Supabase channels)

#### `reviews`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `vendor_id` | UUID FK | |
| `user_id` | UUID FK | |
| `rating` | INTEGER | 1–5 |
| `comment` | TEXT | |
| `created_at` | TIMESTAMPTZ | |

### Categories

**Products:** Roupas, Cabelos & Laces, Maquilhagem, Lingerie, Doces & Catering, Bebidas Artesanais, Beats & Áudio, Design & Arte, Promoções

**Services:** Cabelo, Maquilhagem, Unhas, Spa em Casa, Fotografia, Videografia, Design, Produção Musical

**Publish modal categories (extended):** Roupas & Moda, Cabelos & Laces, Maquilhagem, Lingerie, Acessórios, Doces & Catering, Bebidas Artesanais, Beats & Áudio, Design & Arte, Serviços de Beleza, Spa & Bem-estar, Fotografia, Videografia, Produção Musical, Outros

### Key Supabase Queries

**Reels feed (paginated):**
```typescript
// Fetch products + services where is_reel = true
supabase.from("products")
  .select("*, vendor_subscriptions(*, profiles(*))")
  .eq("is_reel", true)
  .order("created_at", { ascending: false })
  .range(offset, offset + limit);

supabase.from("services")
  .select("*, vendor_subscriptions(*, profiles(*))")
  .eq("is_reel", true)
  .order("created_at", { ascending: false })
  .range(offset, offset + limit);
```

**Marketplace (non-reel):**
```typescript
supabase.from("products")
  .select("*, vendor_subscriptions(id, user_id, store_name, business_name, full_name, profiles(id, store_name, avatar_url, username))")
  .eq("is_reel", false) // or filter is_reel IS NOT TRUE
  .order("created_at", { ascending: false });
```

**Publish limit:** Max **5 listings per vendor per day** (products + services combined).

### Personalization Engine (`personalization.ts`)

Port this logic client-side. Taste profile stored in `localStorage` key `musa_taste_profile`.

**Taste categories (onboarding chips):**
Roupas, Cabelos & Laces, Maquilhagem, Lingerie, Unhas, Spa em Casa, Fotografia, Videografia, Design & Arte, Beats & Áudio

**TasteProfile shape:**
```typescript
type TasteProfile = {
  categories: string[];
  searches: string[];
  interactions: Record<string, number>; // category/id → weight
  completed: boolean;
};
```

**For You ranking formula (`scoreForYouItem`):**
```
finalScore = 100 * (0.40*taste + 0.25*popularity + 0.25*recency + 0.10*social) - (diversityPenalty * 12)
```

Where:
- **taste** — category match (+9), interaction weights, search match (+12)
- **popularity** — log-scaled likes×2 + favorites×3 + views×0.75 + comments×2.5 + shares×1.5
- **recency** — exponential decay with 72h half-life
- **social** — +1 if user follows the vendor
- **diversityPenalty** — reduces same-vendor/category clustering

Use `sortForYouItems()` for Home feed and Reels ordering.

### AI Integration

1. **Content moderation** (on publish): Groq `llama-3.3-70b-versatile` via OpenAI-compatible API. Returns `{ safe: boolean, category: string }`. Fallback: local keyword blocklist. Sets `flagged_for_review: true` on unsafe content.

2. **Musa AI assistant** (optional FAB): Platform-scoped chatbot for sellers. Uses Groq/OpenAI. Refuses off-topic, sexual, violent, or hate content.

3. **Blocked words** (client + server): sexo, porn, nude, racista, droga, fraude, golpe, arma, matar, ilegal, contrabando, etc.

---

## D. Core Screens & UX

### Global: Bottom Navigation (Floating Glass Bar)

Fixed at bottom, **mobile only**, z-index 50. Hidden on Reels full-screen mode optional (or overlay with safe padding).

| Tab | Icon | Route | Auth |
|---|---|---|---|
| Início | Home | `/` | No |
| Reels | Clapperboard | `/reels` | No |
| **Publicar** | PlusSquare | Action sheet | Yes |
| Favoritos | Heart | `/favoritos` | Yes |
| Perfil | User | `/perfil` | Yes |

**Publish button (center):** Elevated `scale-110`, rose gradient background, `.sheen` animation, `shadow-neon`. Opens **PublishActionSheet**.

**Active state:** Circular primary background, white icon, subtle pulse animation, label in primary color.

**Auth gate:** Tapping Favoritos/Perfil without session → trigger Google sign-in.

---

### Screen 1: Home / Marketplace (`/`)

**Purpose:** Conversion-focused discovery grid — NOT the Reels feed.

**Layout:**
1. **Header** — MUSA logo, search icon, notifications bell
2. **Hero carousel** — Editorial beauty imagery with `.display` serif headlines
3. **"Para Ti" section** — Personalized product/service cards ranked by `sortForYouItems()`
4. **Category chips** — Horizontal scroll, taste onboarding if profile incomplete
5. **Product grid** — 2-column masonry/grid, `.luxe-card` styling
6. **Service cards** — Same grid with service-specific badges (home visit, rating stars)

**Product card anatomy:**
- Image (or audio waveform placeholder for Beats)
- Heart favorite toggle (optimistic update)
- Store avatar + name (tap → store profile)
- Title, price in AOA (`Intl.NumberFormat('pt-AO', { currency: 'AOA' })`)
- "Comprar" + "Ver mais" CTAs
- Play button overlay for audio products

**Interactions:**
- Tap card → DetailModal (full description, media gallery, reviews)
- Buy → BuyModal (quantity, WhatsApp handoff)
- Pull-to-refresh on feed
- Infinite scroll pagination

**Taste onboarding modal:** Show category chips on first visit. Save to localStorage. Re-rank feed immediately.

---

### Screen 2: Reels / Home Feed (`/reels`) — TikTok Style

**Purpose:** Full-screen vertical video/image discovery. Primary engagement driver.

**Container:**
```html
<div class="fixed inset-0 bg-black">
  <div class="h-[100dvh] overflow-y-scroll scroll-smooth snap-y snap-mandatory">
    <!-- one reel per snap-start h-[100dvh] slide -->
  </div>
</div>
```

**Each reel slide:**
1. **Media layer** — `<video>` (autoplay when ≥70% visible via IntersectionObserver, loop, playsInline, muted by default) OR `<img>` fallback
2. **Gradient overlay** — `bg-gradient-to-t from-black/80 via-black/20 to-transparent`
3. **Top search bar** — Glass pill, filter by store/username/title/description
4. **Mute toggle** — Top-right, 44px circle, glass background
5. **Bottom-left info block** (above nav):
   - `@username` (tap → store profile)
   - Description (3-line clamp)
   - Price in AOA (primary color, bold)
   - **Comprar** button (rose gradient) + **Ver mais** (white outline)
6. **Right-side action column** (bottom-28, gap-5):
   - ❤️ Curtir (toggle, pink fill when liked)
   - 💬 Comentar → CommentsModal
   - ↗️ Partilhar → `navigator.share` or clipboard
   - 💚 WhatsApp → `wa.me/{phone}`

**Gestures & micro-interactions:**
- **Double-tap anywhere** on slide → floating heart animation (Framer Motion), haptic vibrate (50ms), auto-like
- **Vertical swipe** → snap to next/previous reel
- **Infinite scroll** → fetch next page when within 500px of bottom

**Data:** Merge `products` + `services` where `is_reel = true`. Rank with `sortForYouItems()`. Paginate 5+5 per page.

**Empty states:**
- No reels: "Ainda não há reels" + CTA to publish
- Search no results: inline message

---

### Screen 3: Marketplace / Store Detail (`/store/:id`)

**Purpose:** Vendor storefront — trust + conversion.

**Sections:**
- Store header: photo, name, follow button, follower count
- Product/service tabs or unified grid
- Reviews section (star average + list)
- WhatsApp contact CTA

---

### Screen 4: Favoritos (`/favoritos`)

Saved products and services from `favorites` table. Grid layout matching Home cards. Empty state with browse CTA.

---

### Screen 5: Perfil (`/perfil`)

- Google avatar + editable name
- Creator dashboard link (if vendor)
- My listings (products + services)
- Settings, sign out
- Vendor stats: views, favorites, followers

---

### Screen 6: Musa Studio — Upload Flow

Triggered from bottom nav **Publicar** → **PublishActionSheet**:

| Option | Label | Behavior |
|---|---|---|
| Publicar no Site | ShoppingBag icon | Opens SellModal with `is_reel: false` |
| Publicar no Reels | Clapperboard icon | Opens SellModal with `is_reel: true` |

**SellModal — 3-step wizard:**

**Step 1 · Dados da Loja**
- Store name, owner full name, WhatsApp phone (required, min 9 digits)
- Store photo upload (MediaUploader → `musa-media` bucket)
- Validation + blocked word check

**Step 2 · Publicar Produto ou Serviço**
- Toggle: Produto / Serviço
- Name, price (AOA), category picker, description
- **MediaUploader** — immersive drag/drop zone:
  - Camera capture on mobile (`capture="environment"`)
  - Separate audio picker (Music icon) for Beats products
  - Up to 5 files, 50MB each
  - Preview grid with video play overlay
- For Reels mode: encourage vertical video; set `is_reel: true`

**Step 3 · Confirmação**
- AI moderation check (Groq)
- Summary review
- Publish → Supabase insert + toast success
- Daily limit enforcement (5/day)

**Immersive upload UX requirements:**
- Full-screen modal with glass header
- Step indicator pills
- Framer Motion slide transitions between steps
- Upload progress bar with percentage
- Haptic feedback on successful upload

---

### Screen 7: Modals & Overlays (Shared)

| Modal | Trigger | Content |
|---|---|---|
| BuyModal | Comprar button | Quantity, total, WhatsApp order message |
| DetailModal | Ver mais | Full media carousel, description, reviews |
| CommentsModal | Comentar on Reels | Thread from `post_comments`, add comment |
| OnboardingGate | First login | Guest vs Creator choice, taste chips |
| MusaAiFab | Floating button | AI assistant chat (optional v1.1) |

---

### Screen 8: Messages (`/mensagens`, `/chat/:id`)

Conversation list + realtime chat via Supabase channels. Optional for v1 — scaffold routes.

---

## E. Business Rules & Edge Cases

1. **WhatsApp is the checkout** — No in-app payments in v1. "Comprar" opens WhatsApp with pre-filled order message.
2. **Publish requires auth + vendor record** — Auto-create `vendor_subscriptions` on first publish.
3. **Reels vs Store content** — Same tables, separated by `is_reel` boolean.
4. **Moderation** — AI check + keyword blocklist. Unsafe content gets `flagged_for_review: true` but may still publish (fail-open on Turnstile).
5. **Follow system** — Users follow vendors (`vendor_subscriptions.id`), not individual products.
6. **Favorites** — Optimistic UI with React Query rollback on error.
7. **Price display** — Always format as Angolan Kwanza; show "Preço sob consulta" if null/zero.
8. **Media URL resolution** — Priority: `media_urls[0]` → `image_url` → `img` → placeholder gradient with first letter.

---

## F. Implementation Priorities (Build Order)

### Phase 1 — Foundation
1. Vite + React + Tailwind v4 setup with full design tokens from Section B
2. Supabase client + Google Auth
3. Bottom navigation shell with glass styling
4. Basic routing (/, /reels, /favoritos, /perfil)

### Phase 2 — Core Experience
5. ReelsFeed with snap scroll, video autoplay, overlay UI, double-tap like
6. Home marketplace grid with ProductCard/ServiceCard
7. Personalization engine port (`personalization.ts`)
8. Favorites + Follows hooks

### Phase 3 — Creator Tools
9. PublishActionSheet + SellModal 3-step wizard
10. MediaUploader with Supabase Storage
11. AI moderation integration

### Phase 4 — Polish
12. Store profile page
13. Comments on Reels
14. Notifications center
15. Capacitor wrapper prep (safe areas, native share, haptics)

---

## G. Non-Goals (v1)

- In-app payment processing
- Push notifications (Capacitor phase)
- Desktop layout optimization
- Admin dashboard
- Replacing or migrating the existing web app

---

## H. Quality Checklist

Before shipping each screen, verify:

- [ ] Renders correctly at 390×844
- [ ] All touch targets ≥ 44px
- [ ] Glass panels use backdrop-blur + semi-transparent backgrounds
- [ ] Colors use CSS variables only (no hardcoded hex except Reels overlay accents)
- [ ] Portuguese copy throughout
- [ ] Prices in AOA format
- [ ] Auth gates on protected actions
- [ ] Loading skeletons match `.luxe-card` / black Reels skeletons
- [ ] Framer Motion transitions on modals and action sheets
- [ ] Supabase queries match schema in Section C
- [ ] `sortForYouItems()` applied to feeds
- [ ] Safe area padding on bottom nav

---

**End of Master Prompt.** Build the MUSA mobile app following this document as the authoritative specification. Prioritize Reels + Marketplace + Publish flow as the MVP triangle.
