import { createContext, useContext, useState, ReactNode } from "react";

interface SellContextType {
  sellOpen: boolean;
  setSellOpen: (open: boolean) => void;
}

const SellContext = createContext<SellContextType | undefined>(undefined);

export function SellProvider({ children }: { children: ReactNode }) {
  const [sellOpen, setSellOpen] = useState(false);

  return (
    <SellContext.Provider value={{ sellOpen, setSellOpen }}>
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
