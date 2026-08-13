import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useConversations } from "@/hooks/useConversations";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/mensagens")({
  component: MensagensPage,
});

function MensagensPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { data: conversations, isLoading } = useConversations();

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/" });
    }
  }, [loading, user, navigate]);

  if (loading || isLoading) {
    return <div className="p-4">A carregar...</div>;
  }

  if (!user) {
    return null; // Will redirect
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Mensagens</h1>
      {(!conversations || conversations.length === 0) ? (
        <p>Não tem conversas ativas.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {conversations.map((conv: any) => {
            const isUserA = conv.participant_a === user.id;
            const otherUser = isUserA ? conv.user_b : conv.user_a;
            
            // Note: Replace below with the actual way we extract user info from `raw_user_meta_data` or `profiles`
            const displayName = otherUser?.full_name || otherUser?.name || otherUser?.raw_user_meta_data?.name || "Utilizador MUSA";
            const avatarUrl = otherUser?.avatar_url || otherUser?.raw_user_meta_data?.avatar_url || "";

            return (
              <Link
                key={conv.id}
                to="/chat/$conversationId"
                params={{ conversationId: conv.id }}
                className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 transition"
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt={displayName} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="font-semibold">{displayName}</h3>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
