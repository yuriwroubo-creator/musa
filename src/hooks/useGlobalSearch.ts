import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { globalSearch } from "@/lib/algolia";

/** Pesquisa global (Algolia) com debounce, para a barra de pesquisa. */
export function useGlobalSearch(query: string, debounceMs = 250) {
  const [debounced, setDebounced] = useState(query);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(query), debounceMs);
    return () => clearTimeout(id);
  }, [query, debounceMs]);

  return useQuery({
    queryKey: ["global-search", debounced],
    enabled: debounced.trim().length > 1,
    queryFn: () => globalSearch(debounced),
    placeholderData: (prev) => prev,
  });
}