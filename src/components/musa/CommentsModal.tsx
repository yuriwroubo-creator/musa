import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function CommentsModal({ open, onClose, post }: any) {
  const { user } = useAuth();
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [newComment, setNewComment] = useState("");

  const postId = post?.id;
  const postType = post?.type || "product";

  useEffect(() => {
    if (!open || !postId) return;
    setLoading(true);
    supabase
      .from("post_comments")
      .select("*, profiles(*)")
      .eq("post_id", postId)
      .order("created_at", { ascending: true })
      .then((res) => {
        if (res.error) {
          console.error(res.error);
          toast.error("Erro ao carregar comentários");
        } else setComments(res.data || []);
      })
      .finally(() => setLoading(false));
  }, [open, postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Inicia sessão para comentar");
      return;
    }
    if (!newComment.trim()) return;
    try {
      const { error } = await supabase.from("post_comments").insert({
        post_id: postId,
        post_type: postType,
        user_id: user.id,
        comment: newComment.trim(),
      });
      if (error) throw error;
      setNewComment("");
      // reload
      const { data } = await supabase
        .from("post_comments")
        .select("*, profiles(*)")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });
      setComments(data || []);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao enviar comentário");
    }
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[130] flex items-end justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-2xl bg-card p-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">Comentários</h3>
          <button onClick={onClose} className="p-2 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-3 max-h-64 overflow-y-auto space-y-3">
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : comments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Seja o primeiro a comentar.</p>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-bold text-primary">
                  {c.profiles?.full_name?.[0] || "U"}
                </div>
                <div>
                  <p className="text-sm font-medium">{c.profiles?.full_name || "Utilizador"}</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{c.comment}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <form onSubmit={handleSubmit} className="mt-4">
          <div className="flex gap-2">
            <input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Escreve um comentário..."
              className="flex-1 rounded-xl border border-border-soft bg-background px-3 py-2 text-sm outline-none"
            />
            <button type="submit" className="rounded-xl bg-primary px-4 py-2 text-white">
              Enviar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
