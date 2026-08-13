import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface FavoriteItem {
  id: string;
  user_id: string;
  item_id: string;
  item_type: "product" | "service";
  created_at: string;
}

export function useFavorites() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch favorites for the current user
  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ["favorites", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("favorites")
        .select("*")
        .eq("user_id", user.id);
      
      if (error) {
        console.error("Error fetching favorites:", error);
        return [];
      }
      return data as FavoriteItem[];
    },
    enabled: !!user,
  });

  // Toggle favorite mutation
  const toggleFavorite = useMutation({
    mutationFn: async ({ itemId, itemType, isFavorite }: { itemId: string; itemType: "product" | "service"; isFavorite: boolean }) => {
      if (!user) {
        throw new Error("unauthenticated");
      }

      if (isFavorite) {
        // Remove favorite
        const { error } = await supabase
          .from("favorites")
          .delete()
          .match({ user_id: user.id, item_id: itemId, item_type: itemType });
        
        if (error) throw error;
      } else {
        // Add favorite
        const { error } = await supabase
          .from("favorites")
          .insert({
            user_id: user.id,
            item_id: itemId,
            item_type: itemType,
          });
        
        if (error) throw error;
      }
    },
    onMutate: async ({ itemId, itemType, isFavorite }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ["favorites", user?.id] });
      const previousFavorites = queryClient.getQueryData<FavoriteItem[]>(["favorites", user?.id]);

      if (isFavorite) {
        queryClient.setQueryData<FavoriteItem[]>(["favorites", user?.id], (old) => 
          (old || []).filter((f) => f.item_id !== itemId)
        );
      } else {
        queryClient.setQueryData<FavoriteItem[]>(["favorites", user?.id], (old) => [
          ...(old || []),
          {
            id: `temp-${itemId}`,
            user_id: user!.id,
            item_id: itemId,
            item_type: itemType,
            created_at: new Date().toISOString(),
          },
        ]);
      }

      return { previousFavorites };
    },
    onError: (err, variables, context) => {
      if (err.message === "unauthenticated") {
        toast.error("Inicia sessão para guardar favoritos");
      } else {
        toast.error("Ocorreu um erro ao atualizar os favoritos");
      }
      // Rollback
      if (context?.previousFavorites) {
        queryClient.setQueryData(["favorites", user?.id], context.previousFavorites);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites", user?.id] });
    },
  });

  const checkIsFavorite = (itemId: string) => {
    return favorites.some((f) => f.item_id === itemId);
  };

  return {
    favorites,
    isLoading,
    toggleFavorite,
    checkIsFavorite,
  };
}
