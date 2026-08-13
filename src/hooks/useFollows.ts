import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface FollowItem {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export function useFollows() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch follows for the current user
  const { data: follows = [], isLoading } = useQuery({
    queryKey: ["follows", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("follows")
        .select("*")
        .eq("follower_id", user.id);
      
      if (error) {
        console.error("Error fetching follows:", error);
        return [];
      }
      return data as FollowItem[];
    },
    enabled: !!user,
  });

  // Toggle follow mutation
  const toggleFollow = useMutation({
    mutationFn: async ({ followingId, isFollowing }: { followingId: string; isFollowing: boolean }) => {
      if (!user) {
        throw new Error("unauthenticated");
      }

      if (isFollowing) {
        // Remove follow
        const { error } = await supabase
          .from("follows")
          .delete()
          .match({ follower_id: user.id, following_id: followingId });
        
        if (error) throw error;
      } else {
        // Add follow
        const { error } = await supabase
          .from("follows")
          .insert({
            follower_id: user.id,
            following_id: followingId,
          });
        
        if (error) throw error;
      }
    },
    onMutate: async ({ followingId, isFollowing }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ["follows", user?.id] });
      const previousFollows = queryClient.getQueryData<FollowItem[]>(["follows", user?.id]);

      if (isFollowing) {
        queryClient.setQueryData<FollowItem[]>(["follows", user?.id], (old) => 
          (old || []).filter((f) => f.following_id !== followingId)
        );
      } else {
        queryClient.setQueryData<FollowItem[]>(["follows", user?.id], (old) => [
          ...(old || []),
          {
            id: `temp-${followingId}`,
            follower_id: user!.id,
            following_id: followingId,
            created_at: new Date().toISOString(),
          },
        ]);
      }

      return { previousFollows };
    },
    onError: (err, variables, context) => {
      if (err.message === "unauthenticated") {
        toast.error("Inicia sessão para seguir lojas");
      } else {
        toast.error("Ocorreu um erro ao atualizar.");
      }
      // Rollback
      if (context?.previousFollows) {
        queryClient.setQueryData(["follows", user?.id], context.previousFollows);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["follows", user?.id] });
      // Invalidate the vendor_subscriptions to possibly refresh global follower counts if we implement them
      queryClient.invalidateQueries({ queryKey: ["vendor_follower_counts"] });
    },
  });

  const checkIsFollowing = (followingId: string) => {
    return follows.some((f) => f.following_id === followingId);
  };

  return {
    follows,
    isLoading,
    toggleFollow,
    checkIsFollowing,
  };
}
