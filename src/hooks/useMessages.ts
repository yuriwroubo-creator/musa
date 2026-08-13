import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useMessages(conversationId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!conversationId,
  });

  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`public:messages:conversation_id=${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          queryClient.setQueryData(
            ["messages", conversationId],
            (oldData: any[]) => {
              if (!oldData) return [payload.new];
              // Evitar duplicados caso a nossa própria mutação já tenha adicionado (optimistic update ou cache)
              if (oldData.find((msg) => msg.id === payload.new.id)) return oldData;
              return [...oldData, payload.new];
            }
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, queryClient]);

  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      if (!user) throw new Error("Not authenticated");

      // Insert message
      const { data: message, error } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content,
        })
        .select()
        .single();

      if (error) throw error;

      // Find receiver
      const { data: conv, error: convError } = await supabase
        .from("conversations")
        .select("participant_a, participant_b")
        .eq("id", conversationId)
        .single();

      if (!convError && conv) {
        const receiverId = conv.participant_a === user.id ? conv.participant_b : conv.participant_a;
        if (receiverId) {
          await supabase.from("notifications").insert({
            user_id: receiverId,
            title: "Nova mensagem",
            message: "Recebeu uma nova mensagem no chat.",
            type: "chat",
            read: false,
          });
        }
      }

      return message;
    },
    onSuccess: (newMessage) => {
      queryClient.setQueryData(
        ["messages", conversationId],
        (oldData: any[]) => {
          if (!oldData) return [newMessage];
          if (oldData.find((msg) => msg.id === newMessage.id)) return oldData;
          return [...oldData, newMessage];
        }
      );
    },
  });

  return {
    messages: query.data || [],
    isLoading: query.isLoading,
    sendMessage,
  };
}
