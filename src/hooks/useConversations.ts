import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useConversations() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["conversations", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("conversations")
        .select(`
          id,
          participant_a,
          participant_b,
          created_at,
          user_a:profiles!participant_a(id, full_name, avatar_url),
          user_b:profiles!participant_b(id, full_name, avatar_url)
        `)
        .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Fallback if profiles table is named differently or if it fails, adjust select accordingly
      return data || [];
    },
    enabled: !!user,
  });
}
