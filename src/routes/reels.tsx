import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/reels")({
  component: ReelsPage,
});

function ReelsPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-bold text-foreground">Reels</h1>
        <p className="mt-2 text-sm text-muted-foreground">Em breve</p>
      </div>
    </div>
  );
}