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
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        // First try to fetch with joined profiles
        const res = await supabase
          .from("post_comments")
          .select("*, profiles(id, full_name, avatar_url)")
          .eq("post_id", postId)
          .order("created_at", { ascending: true });

        if (res.error) {
          console.warn("Comments select with profiles failed:", res.error);
          // fallback to simple select (no join) in case RLS or relation issues exist
          const res2 = await supabase
            .from("post_comments")
            .select("*")
            .eq("post_id", postId)
            .order("created_at", { ascending: true });

          if (res2.error) {
            console.error("Fallback comments select also failed:", res2.error);
            toast.error(res2.error.message || "Erro ao carregar comentários");
          } else if (!cancelled) {
            setComments(res2.data || []);
          }
        } else if (!cancelled) {
          setComments(res.data || []);
        }
      } catch (err: any) {
        console.error("Unexpected error loading comments:", err);
        toast.error(err?.message || "Erro ao carregar comentários");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
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
      const { data, error: reloadError } = await supabase
        .from("post_comments")
        .select("*, profiles(id, full_name, avatar_url)")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });
      if (reloadError) {
        console.warn("Reload comments after insert failed:", reloadError);
        // attempt simple reload
        const { data: d2, error: err2 } = await supabase
          .from("post_comments")
          .select("*")
          .eq("post_id", postId)
          .order("created_at", { ascending: true });
        if (err2) {
          console.error("Fallback reload also failed:", err2);
          toast.error(err2.message || "Erro ao carregar comentários");
        } else {
          setComments(d2 || []);
        }
      } else {
        setComments(data || []);
      }
    } catch (err) {
      console.error(err);
      toast.error((err as any)?.message || "Erro ao enviar comentário");
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
