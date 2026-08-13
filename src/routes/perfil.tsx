import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, User as UserIcon, Mail } from "lucide-react";
import { useEffect } from "react";
import { SiteHeader } from "@/components/musa/SiteHeader";

export const Route = createFileRoute("/perfil")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/", replace: true });
    }
  }, [user, loading, navigate]);

  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      
      if (error && error.code !== "PGRST116") throw error; // PGRST116 is not found
      return data;
    },
    enabled: !!user,
  });

  if (loading || !user) {
    return <div className="flex min-h-screen items-center justify-center">A carregar...</div>;
  }

  // Fallback to user metadata if profile table doesn't have it yet
  const fullName = profile?.full_name || user.user_metadata?.full_name || "Utilizador";
  const avatarUrl = profile?.avatar_url || user.user_metadata?.avatar_url;
  const email = user.email;

  const handleLogout = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader
        query=""
        onQueryChange={() => {}}
        cartCount={0}
        onCartClick={() => {}}
        onSellClick={() => {}}
      />
      <main className="mx-auto w-full max-w-xl px-5 pt-10 pb-20 lg:pt-16">
        <div className="mb-8 text-center">
          <h1 className="display text-2xl lg:text-3xl">A Minha Conta</h1>
          <p className="mt-2 text-sm text-muted-foreground">Gere o teu perfil e preferências</p>
        </div>

        <div className="rounded-3xl border border-border-soft bg-card p-6 shadow-soft lg:p-8">
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
            <div className="flex size-20 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground sm:size-24">
              {avatarUrl ? (
                <img src={avatarUrl} alt={fullName} className="size-full rounded-full object-cover" />
              ) : (
                <UserIcon className="size-8 sm:size-10" />
              )}
            </div>
            
            <div className="flex-1">
              {loadingProfile ? (
                <div className="flex animate-pulse flex-col gap-2">
                  <div className="h-6 w-32 rounded bg-muted"></div>
                  <div className="h-4 w-48 rounded bg-muted"></div>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-bold">{fullName}</h2>
                  <div className="mt-1 flex items-center justify-center gap-1.5 text-sm text-muted-foreground sm:justify-start">
                    <Mail className="size-3.5" />
                    {email}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="mt-8 border-t border-border-soft pt-8">
            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-destructive/10 px-4 py-3 text-sm font-bold text-destructive transition-colors hover:bg-destructive/20 active:scale-[0.98]"
            >
              <LogOut className="size-4" strokeWidth={2.5} />
              Terminar Sessão
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
