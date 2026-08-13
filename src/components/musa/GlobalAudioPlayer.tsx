import { Play, Pause, X, Music } from "lucide-react";
import { useAudio } from "@/lib/AudioContext";

export function GlobalAudioPlayer() {
  const { currentTrack, isPlaying, play, pause, toggle, progress } = useAudio();

  if (!currentTrack) return null;

  return (
    <div className="fixed bottom-[72px] lg:bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-sm z-50">
      <div className="bg-card/95 backdrop-blur-xl border border-border-soft rounded-2xl shadow-neon-lg overflow-hidden flex flex-col">
        {/* Progress Bar */}
        <div className="h-1 w-full bg-secondary">
          <div 
            className="h-full bg-primary transition-all duration-100 ease-linear" 
            style={{ width: `${progress * 100}%` }} 
          />
        </div>
        
        {/* Controls */}
        <div className="px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Music className="w-5 h-5 text-primary" />
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-bold truncate">Música em reprodução</span>
              <span className="text-xs text-muted-foreground truncate">MUSA Audio</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            <button 
              onClick={toggle}
              className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white shadow-neon hover:scale-105 transition-transform"
            >
              {isPlaying ? <Pause fill="currentColor" className="w-4 h-4" /> : <Play fill="currentColor" className="w-4 h-4 ml-0.5" />}
            </button>
            <button 
              onClick={() => pause()} // Optionally add a way to clear the track, for now pause is enough
              className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-secondary transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
