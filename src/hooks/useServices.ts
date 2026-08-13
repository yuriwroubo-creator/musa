import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Service } from "@/types/musa";

export interface ServiceFilters {
  category?: string;
  search?: string;
  limit?: number;
}

export async function fetchServices(filters: ServiceFilters = {}): Promise<Service[]> {
  let query = supabase
    .from("services")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters.category) query = query.eq("category", filters.category);
  if (filters.search) query = query.ilike("name", `%${filters.search}%`);
  if (filters.limit) query = query.limit(filters.limit);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Service[];
}

export function useServices(filters: ServiceFilters = {}) {
  return useQuery({
    queryKey: ["services", filters],
    queryFn: () => fetchServices(filters),
  });
}

export function useService(id: string | undefined) {
  return useQuery({
    queryKey: ["service", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data as Service | null;
    },
  });
}