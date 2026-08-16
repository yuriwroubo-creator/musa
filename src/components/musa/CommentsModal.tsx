import React, { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function CommentsModal({ open, onClose, post }: any) {
  const { user } = useAuth();
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const postId = post?.id;
  const postType = post?.type || "product";

  const loadComments = async () => {
    if (!postId) return;

    const { data, error } = await supabase
      .from("post_comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Comments select failed:", error);
      toast.error(error.message || "Erro ao carregar comentários");
      return;
    }

    const userIds = [...new Set((data ?? []).map((comment) => comment.user_id).filter(Boolean))];
    let profileMap = new Map();

    if (userIds.length > 0) {
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, username")
        .in("id", userIds);

      if (!profilesError) {
        profileMap = new Map((profilesData ?? []).map((profile) => [profile.id, profile]));
      } else {
        console.warn("Profiles lookup for comments failed:", profilesError);
      }
    }

    const hydratedComments = (data ?? []).map((comment) => ({
      ...comment,
      profiles: profileMap.get(comment.user_id) || null,
      full_name: profileMap.get(comment.user_id)?.full_name || comment.full_name || "Utilizador",
    }));

    setComments(hydratedComments);
  };

  useEffect(() => {
    // Prevent body scroll when modal is open
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";

    if (!open || !postId) return;

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        await loadComments();
      } catch (err: any) {
        console.error("Unexpected error loading comments:", err);
        toast.error(err?.message || "Erro ao carregar comentários");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      document.body.style.overflow = "";
    };
  }, [open, postId]);

  // Auto-focus input when modal opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 150);
    }
  }, [open]);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const updateKeyboardOffset = () => {
      const keyboardHeight = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
      setKeyboardOffset(keyboardHeight > 120 ? keyboardHeight : 0);
    };

    updateKeyboardOffset();
    viewport.addEventListener("resize", updateKeyboardOffset);
    viewport.addEventListener("scroll", updateKeyboardOffset);
    window.addEventListener("resize", updateKeyboardOffset);

    return () => {
      viewport.removeEventListener("resize", updateKeyboardOffset);
      viewport.removeEventListener("scroll", updateKeyboardOffset);
      window.removeEventListener("resize", updateKeyboardOffset);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Inicia sessão para comentar");
      return;
    }
    if (!newComment.trim() || !postId) return;

    try {
      const { error } = await supabase.from("post_comments").insert({
        post_id: postId,
        post_type: postType,
        user_id: user.id,
        comment: newComment.trim(),
      });
      if (error) throw error;

      setNewComment("");
      await loadComments();
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
      className="fixed inset-0 z-[130] bg-black/40 backdrop-blur-sm transition-opacity duration-300"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="fixed right-0 top-0 bottom-[76px] sm:bottom-0 w-full max-w-[400px] overflow-hidden bg-card flex flex-col shadow-2xl transition-transform duration-300 ease-out animate-in slide-in-from-right"
        style={{
          bottom: `calc(${Math.max(keyboardOffset, 0) + 76}px + env(safe-area-inset-bottom))`,
        }}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-white/10 shrink-0">
            <h3 className="text-lg font-bold">Comentários</h3>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Comments List with auto scroll to form */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 space-y-4 flex flex-col">
            {loading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : comments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Seja o primeiro a comentar.</p>
            ) : (
              comments.map((c) => (
                <div key={c.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-bold text-primary overflow-hidden flex-shrink-0">
                    {c.profiles?.full_name?.[0] || (c.full_name ? c.full_name[0] : "U")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{c.profiles?.full_name || c.full_name || "Utilizador"}</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">{c.comment}</p>
                  </div>
                </div>
              ))
            )}
            <div className="flex-1 min-h-[120px]" />
          </div>

          {/* Input Form */}
          <form
            onSubmit={handleSubmit}
            className="sticky bottom-0 z-10 shrink-0 border-t border-white/10 bg-card/95 backdrop-blur-sm p-4 space-y-3"
            style={{
              paddingBottom: `calc(env(safe-area-inset-bottom) + ${Math.max(keyboardOffset, 0) + 16}px)`,
            }}
          >
            <p className="text-xs text-muted-foreground">
              💬 <span className="font-semibold">Lembrete:</span> os comentários são públicos e todos podem ver
            </p>
            <div className="flex gap-2">
              <input
                ref={inputRef}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Escreve um comentário..."
                autoComplete="off"
                className="flex-1 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm outline-none placeholder:text-white/40 focus:border-primary focus:bg-white/10 transition-colors"
              />
              <button
                type="submit"
                disabled={!newComment.trim()}
                className="rounded-full bg-primary px-4 py-2 text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[60px]"
              >
                Enviar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
