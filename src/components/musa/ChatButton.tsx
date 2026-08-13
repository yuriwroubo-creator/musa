import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useConversations } from "@/hooks/useConversations";

interface ChatButtonProps {
  vendorUserId: string;
  className?: string;
  label?: string;
}

export function ChatButton({ vendorUserId, className = "", label = "Mensagem" }: ChatButtonProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: conversations } = useConversations();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (!user) {
      // You could redirect to login here, or trigger a login modal
      alert("Por favor, inicie sessão para enviar mensagens.");
      return;
    }

    if (user.id === vendorUserId) {
      alert("Não pode enviar uma mensagem para si mesmo.");
      return;
    }

    setLoading(true);

    try {
      // Check if conversation already exists
      const existing = conversations?.find(
        (c: any) =>
          (c.participant_a === user.id && c.participant_b === vendorUserId) ||
          (c.participant_b === user.id && c.participant_a === vendorUserId)
      );

      if (existing) {
        navigate({ to: "/chat/$conversationId", params: { conversationId: existing.id } });
        return;
      }

      // If not in cache, double check in DB to avoid duplicates
      const { data: checkData, error: checkError } = await supabase
        .from("conversations")
        .select("id")
        .or(`and(participant_a.eq.${user.id},participant_b.eq.${vendorUserId}),and(participant_a.eq.${vendorUserId},participant_b.eq.${user.id})`)
        .maybeSingle();

      if (checkError) throw checkError;

      if (checkData) {
        navigate({ to: "/chat/$conversationId", params: { conversationId: checkData.id } });
        return;
      }

      // Create new conversation
      const { data: newConv, error: createError } = await supabase
        .from("conversations")
        .insert({
          participant_a: user.id,
          participant_b: vendorUserId,
        })
        .select()
        .single();

      if (createError) throw createError;

      navigate({ to: "/chat/$conversationId", params: { conversationId: newConv.id } });
    } catch (err) {
      console.error("Error starting chat:", err);
      alert("Ocorreu um erro ao iniciar o chat.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`flex items-center justify-center gap-2 px-4 py-2 bg-black text-white rounded-full font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors ${className}`}
    >
      <MessageCircle size={20} />
      <span>{loading ? "A processar..." : label}</span>
    </button>
  );
}
