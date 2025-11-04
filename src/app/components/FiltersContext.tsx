"use client";

import { createContext, useContext, useState } from "react";

type FiltersContextType = {
  open: boolean;
  toggle: () => void;
  minRating: number | null;
  setMinRating: (v: number | null) => void;
  maxPrice: number | null;
  setMaxPrice: (v: number | null) => void;
  selectedAmenity: string;
  setSelectedAmenity: (v: string) => void;
};

const FiltersContext = createContext<FiltersContextType | undefined>(undefined);

export function FiltersProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [minRating, setMinRating] = useState<number | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [selectedAmenity, setSelectedAmenity] = useState("");

  const toggle = () => setOpen((prev) => !prev);

  return (
    <FiltersContext.Provider
      value={{
        open,
        toggle,
        minRating,
        setMinRating,
        maxPrice,
        setMaxPrice,
        selectedAmenity,
        setSelectedAmenity,
      }}
    >
      {children}
    </FiltersContext.Provider>
  );
}

export const useFilters = () => {
  const ctx = useContext(FiltersContext);
  if (!ctx) throw new Error("useFilters must be inside FiltersProvider");
  return ctx;
};
