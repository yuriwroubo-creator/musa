import React, { createContext, useContext, useState, useRef, useEffect, ReactNode } from "react";

interface AudioContextType {
  currentTrack: string | null;
  isPlaying: boolean;
  play: (url: string) => void;
  pause: () => void;
  toggle: () => void;
  progress: number; // 0 to 1
}

const AudioContext = createContext<AudioContextType | null>(null);

export function AudioProvider({ children }: { children: ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio();
    
    const handleTimeUpdate = () => {
      if (audioRef.current && audioRef.current.duration) {
        setProgress(audioRef.current.currentTime / audioRef.current.duration);
      }
    };
    
    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
    };

    audioRef.current.addEventListener("timeupdate", handleTimeUpdate);
    audioRef.current.addEventListener("ended", handleEnded);

    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener("timeupdate", handleTimeUpdate);
        audioRef.current.removeEventListener("ended", handleEnded);
        audioRef.current.pause();
      }
    };
  }, []);

  useEffect(() => {
    if (audioRef.current && currentTrack) {
      if (audioRef.current.src !== currentTrack) {
        audioRef.current.src = currentTrack;
        audioRef.current.load();
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      } else {
        if (isPlaying) {
          audioRef.current.play().catch(() => setIsPlaying(false));
        } else {
          audioRef.current.pause();
        }
      }
    }
  }, [currentTrack, isPlaying]);

  const play = (url: string) => {
    if (currentTrack === url) {
      setIsPlaying(true);
    } else {
      setCurrentTrack(url);
      setIsPlaying(true);
    }
  };

  const pause = () => setIsPlaying(false);

  const toggle = () => setIsPlaying((p) => !p);

  return (
    <AudioContext.Provider value={{ currentTrack, isPlaying, play, pause, toggle, progress }}>
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error("useAudio must be used within an AudioProvider");
  }
  return context;
}
