import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ChevronRight, Inbox, MessageCircle, Search, Sparkles, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useConversations } from "@/hooks/useConversations";

export const Route = createFileRoute("/mensagens")({
  component: MensagensPage,
});

type Conversation = {
  id: string;
  participant_a: string;
  participant_b: string;
  created_at?: string;
  user_a?: {
    full_name?: string | null;
    avatar_url?: string | null;
    username?: string | null;
  } | null;
  user_b?: {
    full_name?: string | null;
    avatar_url?: string | null;
    username?: string | null;
  } | null;
};

function MensagensPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { data: conversations, isLoading } = useConversations();
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/" });
    }
  }, [loading, user, navigate]);

  const filteredConversations = useMemo(() => {
    const list = (conversations || []) as Conversation[];
    const q = search.trim().toLowerCase();
    if (!q) return list;

    return list.filter((conversation) => {
      const isUserA = conversation.participant_a === user?.id;
      const otherUser = isUserA ? conversation.user_b : conversation.user_a;
      const displayName =
        otherUser?.full_name || otherUser?.username || "Utilizador MUSA";
      return displayName.toLowerCase().includes(q);
    });
  }, [conversations, search, user?.id]);

  if (loading || isLoading) {
    return <MessagesSkeleton />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-[100dvh] bg-[radial-gradient(circle_at_top,_rgba(255,91,163,0.14),_transparent_26%),linear-gradient(180deg,#fffafc_0%,#fff7fb_48%,#fff 100%)] pb-24 text-foreground">
      <header className="sticky top-0 z-30 border-b border-white/70 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-4xl items-center gap-3 px-4 py-4 lg:px-6">
          <button
            type="button"
            onClick={() => navigate({ to: "/" })}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-gray-200/70 bg-white shadow-sm transition active:scale-95"
            aria-label="Voltar"
          >
            <ArrowLeft className="size-5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-primary/70">
              Inbox MUSA
            </p>
            <h1 className="truncate text-2xl font-black leading-tight sm:text-[2rem]">
              Mensagens
            </h1>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-pink-100 bg-pink-50 px-3 py-2 text-xs font-semibold text-pink-700 sm:flex">
            <Sparkles className="size-4" />
            Android ready
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-4 pt-4 lg:px-6">
        <section className="rounded-[28px] border border-gray-200/70 bg-white/90 p-4 shadow-sm backdrop-blur-sm">
          <div className="flex items-center gap-3 rounded-2xl border border-gray-200/70 bg-gray-50 px-4 py-3">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Procurar conversa..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              inputMode="search"
            />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <InboxStat label="Conversas" value={filteredConversations.length} />
            <InboxStat label="Android" value="OK" />
            <InboxStat label="Rede" value="Live" />
          </div>
        </section>

        {filteredConversations.length === 0 ? (
          <section className="rounded-[28px] border border-dashed border-pink-200 bg-white/85 p-8 text-center shadow-sm">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-pink-50 text-primary">
              <MessageCircle className="size-7" />
            </div>
            <h2 className="mt-4 text-xl font-black">Ainda não tens conversas</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Abre o perfil de uma loja ou criadora e toca em “Mensagem” para começares o chat.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                to="/"
                className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-primary px-5 text-sm font-bold text-white shadow-neon"
              >
                Explorar loja
              </Link>
              <Link
                to="/reels"
                className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-gray-200 bg-white px-5 text-sm font-bold text-foreground"
              >
                Ir aos Reels
              </Link>
            </div>
          </section>
        ) : (
          <section className="grid gap-3">
            {filteredConversations.map((conversation: Conversation) => {
              const isUserA = conversation.participant_a === user.id;
              const otherUser = isUserA ? conversation.user_b : conversation.user_a;
              const displayName =
                otherUser?.full_name || otherUser?.username || "Utilizador MUSA";
              const avatarUrl = otherUser?.avatar_url || "";
              const accent = displayName[0]?.toUpperCase() || "M";
              const startedAt = conversation.created_at
                ? new Date(conversation.created_at).toLocaleDateString("pt-AO", {
                    day: "2-digit",
                    month: "short",
                  })
                : "";

              return (
                <Link
                  key={conversation.id}
                  to="/chat/$conversationId"
                  params={{ conversationId: conversation.id }}
                  className="group flex items-center gap-4 rounded-[26px] border border-gray-200/80 bg-white/90 p-4 shadow-sm transition active:scale-[0.99]"
                >
                  <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-gradient-to-br from-pink-100 to-rose-200 text-lg font-black text-pink-700">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={displayName} className="size-full object-cover" />
                    ) : (
                      accent
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="truncate text-base font-black">{displayName}</h2>
                        <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                          Conversa pronta para continuar
                        </p>
                      </div>
                      <ChevronRight className="mt-0.5 size-5 shrink-0 text-muted-foreground/60 transition group-hover:translate-x-0.5" />
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-pink-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                        <MessageCircle className="size-3.5" />
                        Abrir chat
                      </span>
                      {startedAt && (
                        <span className="text-[11px] font-medium text-muted-foreground">
                          Desde {startedAt}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
}

function InboxStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl bg-gray-50 px-3 py-3 text-center">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-lg font-black text-foreground">{value}</p>
    </div>
  );
}

function MessagesSkeleton() {
  return (
    <div className="min-h-[100dvh] bg-[linear-gradient(180deg,#fffafc_0%,#fff_100%)] pb-24">
      <div className="sticky top-0 z-30 border-b border-gray-200/70 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-4xl items-center gap-3 px-4 py-4 lg:px-6">
          <div className="flex size-11 animate-pulse rounded-full bg-gray-200" />
          <div className="min-w-0 flex-1">
            <div className="h-3 w-24 animate-pulse rounded-full bg-gray-200" />
            <div className="mt-2 h-7 w-40 animate-pulse rounded-full bg-gray-200" />
          </div>
          <div className="hidden h-9 w-28 animate-pulse rounded-full bg-gray-200 sm:block" />
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-4 pt-4 lg:px-6">
        <div className="rounded-[28px] border border-gray-200/70 bg-white/90 p-4 shadow-sm">
          <div className="h-12 animate-pulse rounded-2xl bg-gray-200" />
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="rounded-2xl bg-gray-100 px-3 py-3">
                <div className="mx-auto h-3 w-16 animate-pulse rounded-full bg-gray-200" />
                <div className="mx-auto mt-2 h-6 w-12 animate-pulse rounded-full bg-gray-200" />
              </div>
            ))}
          </div>
        </div>

        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="flex items-center gap-4 rounded-[26px] border border-gray-200/80 bg-white/90 p-4 shadow-sm">
            <div className="size-14 animate-pulse rounded-full bg-gray-200" />
            <div className="min-w-0 flex-1">
              <div className="h-4 w-36 animate-pulse rounded-full bg-gray-200" />
              <div className="mt-3 h-3 w-52 animate-pulse rounded-full bg-gray-200" />
              <div className="mt-4 h-6 w-24 animate-pulse rounded-full bg-gray-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
