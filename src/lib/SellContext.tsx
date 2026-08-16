import { createContext, useContext, useState, ReactNode } from "react";

export type PublishMode = "site" | "reel";

interface SellContextType {
  sellOpen: boolean;
  setSellOpen: (open: boolean) => void;
  publishSheetOpen: boolean;
  setPublishSheetOpen: (open: boolean) => void;
  publishMode: PublishMode;
  setPublishMode: (mode: PublishMode) => void;
  openPublish: (mode: PublishMode) => void;
}

const SellContext = createContext<SellContextType | undefined>(undefined);

export function SellProvider({ children }: { children: ReactNode }) {
  const [sellOpen, setSellOpen] = useState(false);
  const [publishSheetOpen, setPublishSheetOpen] = useState(false);
  const [publishMode, setPublishMode] = useState<PublishMode>("site");

  const openPublish = (mode: PublishMode) => {
    setPublishMode(mode);
    setPublishSheetOpen(false);
    setSellOpen(true);
  };

  return (
    <SellContext.Provider
      value={{
        sellOpen,
        setSellOpen,
        publishSheetOpen,
        setPublishSheetOpen,
        publishMode,
        setPublishMode,
        openPublish,
      }}
    >
      {children}
    </SellContext.Provider>
  );
}

export function useSellModal() {
  const context = useContext(SellContext);
  if (!context) {
    throw new Error("useSellModal must be used within a SellProvider");
  }
  return context;
}
