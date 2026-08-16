import { Play, Pause, X, Music } from "lucide-react";
import { useAudio } from "@/lib/AudioContext";

export function GlobalAudioPlayer() {
  const { currentTrack, currentTrackMeta, isPlaying, pause, toggle, clear, progress } = useAudio();

  if (!currentTrack) return null;

  return (
    <div className="fixed bottom-[78px] left-1/2 z-50 w-[calc(100%-24px)] max-w-sm -translate-x-1/2 lg:bottom-4">
      <div className="overflow-hidden rounded-[24px] border border-gray-200/50 bg-white/85 shadow-2xl backdrop-blur-md">
        <div className="h-1 w-full bg-secondary/90">
          <div
            className="h-full bg-gradient-to-r from-primary via-[#FF6DB0] to-[#FF9EC2] transition-all duration-100 ease-linear"
            style={{ width: `${Math.max(4, progress * 100)}%` }}
          />
        </div>

        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3 overflow-hidden">
            <div
            className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary/10"
              aria-hidden="true"
            >
              {currentTrackMeta?.artwork ? (
                <img src={currentTrackMeta.artwork} alt="" className="size-full object-cover" />
              ) : (
                <Music className="size-5 text-primary" />
              )}
            </div>
            <div className="min-w-0">
              <span className="block truncate text-[13px] font-bold leading-tight">
                {currentTrackMeta?.title || "Música em reprodução"}
              </span>
              <span className="block truncate text-[11px] text-muted-foreground">
                {currentTrackMeta?.creator || "MUSA Audio"}
              </span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={toggle}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-primary text-white shadow-neon transition-transform hover:scale-105 active:scale-95"
              aria-label={isPlaying ? "Pausar áudio" : "Reproduzir áudio"}
            >
              {isPlaying ? (
                <Pause fill="currentColor" className="size-4" />
              ) : (
                <Play fill="currentColor" className="ml-0.5 size-4" />
              )}
            </button>
            <button
              onClick={clear}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary"
              aria-label="Fechar áudio"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        <div className="flex items-end gap-1 px-4 pb-3">
          {["h-2.5", "h-4", "h-3", "h-5", "h-2", "h-[18px]", "h-3"].map((height, index) => (
            <span
              key={index}
              className={`w-1 rounded-full bg-primary/80 transition-all duration-300 ${height} ${isPlaying ? "animate-pulse" : "opacity-40"}`}
              style={{ animationDelay: `${index * 120}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
