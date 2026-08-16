import type { Product, Service } from "@/lib/musa-data";

export const tasteOptions = [
  { id: "Roupas", label: "Moda elegante" },
  { id: "Cabelos & Laces", label: "Cabelos & laces" },
  { id: "Maquilhagem", label: "Glow & make" },
  { id: "Lingerie", label: "Lingerie chique" },
  { id: "Unhas", label: "Unhas premium" },
  { id: "Spa em Casa", label: "Spa e autocuidado" },
  { id: "Fotografia", label: "Conteúdo & fotos" },
  { id: "Videografia", label: "Reels & vídeos" },
  { id: "Design & Arte", label: "Marca pessoal" },
  { id: "Beats & Áudio", label: "Som & beats" },
];

export type TasteProfile = {
  categories: string[];
  searches: string[];
  interactions: Record<string, number>;
  completed: boolean;
};

const storageKey = "musa_taste_profile";

export function getTasteProfile(): TasteProfile {
  if (typeof window === "undefined") {
    return { categories: [], searches: [], interactions: {}, completed: false };
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(storageKey) || "{}") as Partial<TasteProfile>;
    return {
      categories: Array.isArray(parsed.categories) ? parsed.categories : [],
      searches: Array.isArray(parsed.searches) ? parsed.searches : [],
      interactions: parsed.interactions && typeof parsed.interactions === "object" ? parsed.interactions : {},
      completed: Boolean(parsed.completed),
    };
  } catch {
    return { categories: [], searches: [], interactions: {}, completed: false };
  }
}

export function saveTasteProfile(profile: TasteProfile) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey, JSON.stringify(profile));
}

export function scoreCatalogItem(item: Product | Service, profile: TasteProfile, query: string) {
  const text = `${"store" in item ? item.store : item.name} ${item.name} ${"title" in item ? item.title : ""} ${item.category}`.toLowerCase();
  const normalizedQuery = query.trim().toLowerCase();
  let score = Number.parseFloat(item.rating || "0") || 0;

  if (profile.categories.includes(item.category)) score += 9;
  if (profile.interactions[item.category]) score += profile.interactions[item.category] * 2.5;
  if (profile.interactions[item.id]) score += profile.interactions[item.id] * 4;
  if (normalizedQuery && text.includes(normalizedQuery)) score += 12;

  for (const search of profile.searches.slice(0, 6)) {
    if (search && text.includes(search.toLowerCase())) score += 2;
  }

  return score;
}

export type FeedRankableItem = {
  id: string;
  created_at?: string | null;
  category?: string | null;
  name?: string | null;
  title?: string | null;
  description?: string | null;
  store?: string | null;
  store_name?: string | null;
  vendor_id?: string | null;
  likes_count?: number | null;
  favorites_count?: number | null;
  views_count?: number | null;
  comments_count?: number | null;
  shares_count?: number | null;
  __metrics?: {
    likes?: number;
    favorites?: number;
    views?: number;
    comments?: number;
    shares?: number;
  } | null;
  profile?: {
    id?: string | null;
    username?: string | null;
    full_name?: string | null;
    store_name?: string | null;
  } | null;
  vendor_subscriptions?: {
    id?: string | null;
    user_id?: string | null;
    vendor_id?: string | null;
    business_name?: string | null;
    store_name?: string | null;
    full_name?: string | null;
    profiles?: {
      id?: string | null;
      username?: string | null;
      full_name?: string | null;
      store_name?: string | null;
    } | null;
  } | null;
};

export type ForYouContext = {
  profile: TasteProfile;
  query?: string;
  followedVendorIds?: string[];
};

function clamp01(value: number) {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function parseDateValue(value: unknown) {
  const timestamp = new Date(String(value || "")).getTime();
  return Number.isFinite(timestamp) ? timestamp : Date.now();
}

function scorePopularity(item: FeedRankableItem) {
  const metrics = item.__metrics ?? {};
  const likes = Number(item.likes_count ?? metrics.likes ?? 0) || 0;
  const favorites = Number(item.favorites_count ?? metrics.favorites ?? 0) || 0;
  const views = Number(item.views_count ?? metrics.views ?? 0) || 0;
  const comments = Number(item.comments_count ?? metrics.comments ?? 0) || 0;
  const shares = Number(item.shares_count ?? metrics.shares ?? 0) || 0;

  const raw = (2 * likes) + (3 * favorites) + (0.75 * views) + (2.5 * comments) + (1.5 * shares);
  return clamp01(Math.log1p(raw) / Math.log1p(150));
}

function scoreRecency(item: FeedRankableItem, nowMs: number) {
  const createdAt = parseDateValue(item.created_at);
  const ageHours = Math.max(0, (nowMs - createdAt) / (1000 * 60 * 60));
  return clamp01(Math.pow(2, -ageHours / 72));
}

function scoreSocial(item: FeedRankableItem, followedVendorIds: string[]) {
  const ownerId =
    item.vendor_id ||
    item.vendor_subscriptions?.user_id ||
    item.vendor_subscriptions?.vendor_id ||
    item.profile?.id ||
    item.vendor_subscriptions?.profiles?.id ||
    null;

  if (!ownerId) return 0;
  return followedVendorIds.includes(ownerId) ? 1 : 0;
}

function getItemCategory(item: FeedRankableItem) {
  return String(item.category || "").trim().toLowerCase();
}

function getItemVendorKey(item: FeedRankableItem) {
  return String(
    item.vendor_id ||
      item.vendor_subscriptions?.id ||
      item.vendor_subscriptions?.user_id ||
      item.vendor_subscriptions?.vendor_id ||
      item.profile?.id ||
      item.vendor_subscriptions?.profiles?.id ||
      item.id,
  );
}

function scoreDiversityPenalty(
  item: FeedRankableItem,
  vendorFrequency: number,
  categoryFrequency: number,
) {
  const weighted = (vendorFrequency * 1.1) + (categoryFrequency * 0.85);
  return clamp01(weighted / 2.5);
}

export function scoreForYouItem(
  item: FeedRankableItem & Partial<Product & Service>,
  context: ForYouContext,
  itemPool?: FeedRankableItem[],
) {
  const nowMs = Date.now();
  const tasteRaw = scoreCatalogItem(
    item as Product | Service,
    context.profile,
    context.query ?? "",
  );
  const taste = clamp01(tasteRaw / 24);
  const popularity = scorePopularity(item);
  const recency = scoreRecency(item, nowMs);
  const social = scoreSocial(item, context.followedVendorIds ?? []);

  const normalizedPool = itemPool ?? [];
  const vendorKey = getItemVendorKey(item);
  const category = getItemCategory(item);
  const vendorFrequency = normalizedPool.length
    ? normalizedPool.filter((candidate) => getItemVendorKey(candidate) === vendorKey).length / normalizedPool.length
    : 0;
  const categoryFrequency = normalizedPool.length
    ? normalizedPool.filter((candidate) => getItemCategory(candidate) === category).length / normalizedPool.length
    : 0;
  const diversityPenalty = scoreDiversityPenalty(item, vendorFrequency, categoryFrequency);

  return (
    100 * (0.40 * taste + 0.25 * popularity + 0.25 * recency + 0.10 * social) -
    (diversityPenalty * 12)
  );
}

export function sortForYouItems<T extends FeedRankableItem & Partial<Product & Service>>(
  items: T[],
  context: ForYouContext,
) {
  const pool = [...items];
  return [...items].sort((a, b) => {
    const scoreA = scoreForYouItem(a, context, pool);
    const scoreB = scoreForYouItem(b, context, pool);
    if (scoreA !== scoreB) return scoreB - scoreA;
    return parseDateValue(b.created_at) - parseDateValue(a.created_at);
  });
}
