import { liteClient } from "algoliasearch/lite";
import {
  ALGOLIA_APP_ID,
  ALGOLIA_PRODUCTS_INDEX,
  ALGOLIA_SEARCH_KEY,
  ALGOLIA_SERVICES_INDEX,
} from "@/lib/config";

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

/** Pesquisa global nos índices de produtos e serviços. */
export async function globalSearch(
  query: string,
  hitsPerPage = 8,
): Promise<GlobalSearchResults> {
  if (!query.trim()) return { products: [], services: [] };

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

  return { products: hitsOf(0, "product"), services: hitsOf(1, "service") };
}