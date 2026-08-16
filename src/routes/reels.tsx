import { createFileRoute } from "@tanstack/react-router";
import { ReelsFeed } from "@/components/musa/ReelsFeed";

export const Route = createFileRoute("/reels")({
  component: ReelsPage,
});

function ReelsPage() {
  return <ReelsFeed />;
}
