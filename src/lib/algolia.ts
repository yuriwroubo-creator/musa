import { liteClient } from "algoliasearch/lite";
import {
  ALGOLIA_APP_ID,
  ALGOLIA_PRODUCTS_INDEX,
  ALGOLIA_SEARCH_KEY,
  ALGOLIA_SERVICES_INDEX,
} from "@/lib/config";
import { products, services } from "@/lib/musa-data";

export const searchClient = liteClient(ALGOLIA_APP_ID, ALGOLIA_SEARCH_KEY);

export interface SearchHit {
  objectID: string;
  name?: string;
  description?: string;
  price?: number;
  image_url?: string;
  category?: string;
  type: "product" | "service";
}

export interface GlobalSearchResults {
  products: SearchHit[];
  services: SearchHit[];
}

function normalize(value: string | undefined | null) {
  return (value || "").trim().toLowerCase();
}

function fallbackSearch(query: string): GlobalSearchResults {
  const q = normalize(query);
  if (!q) return { products: [], services: [] };

  const productHits = products
    .filter((item) => {
      const haystack = [item.name, item.store, item.category, item.price].join(" ").toLowerCase();
      return haystack.includes(q);
    })
    .map((item) => ({
      objectID: item.id,
      name: item.name,
      description: item.store,
      price: Number.parseFloat(item.price.replace(/[^\d.]/g, "")) || undefined,
      image_url: item.img,
      category: item.category,
      type: "product" as const,
    }));

  const serviceHits = services
    .filter((item) => {
      const haystack = [item.name, item.title, item.category, item.price].join(" ").toLowerCase();
      return haystack.includes(q);
    })
    .map((item) => ({
      objectID: item.id,
      name: item.name,
      description: item.title,
      price: Number.parseFloat(item.price.replace(/[^\d.]/g, "")) || undefined,
      image_url: item.img,
      category: item.category,
      type: "service" as const,
    }));

  return { products: productHits, services: serviceHits };
}

/** Pesquisa global nos índices de produtos e serviços. */
export async function globalSearch(query: string, hitsPerPage = 8): Promise<GlobalSearchResults> {
  if (!query.trim()) return { products: [], services: [] };

  try {
    const { results } = await searchClient.search<Record<string, unknown>>({
      requests: [
        { indexName: ALGOLIA_PRODUCTS_INDEX, query, hitsPerPage },
        { indexName: ALGOLIA_SERVICES_INDEX, query, hitsPerPage },
      ],
    });

    const hitsOf = (index: number, type: SearchHit["type"]) => {
      const result = results[index] as { hits?: Record<string, unknown>[] } | undefined;
      return (result?.hits ?? []).map((hit) => ({ ...hit, type }) as SearchHit);
    };

    const productsHits = hitsOf(0, "product");
    const servicesHits = hitsOf(1, "service");
    if (productsHits.length > 0 || servicesHits.length > 0) {
      return { products: productsHits, services: servicesHits };
    }
  } catch (error) {
    console.warn("[Search] Algolia unavailable, using local fallback:", error);
  }

  return fallbackSearch(query);
}
