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

