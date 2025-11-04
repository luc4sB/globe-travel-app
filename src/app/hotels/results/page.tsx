"use client";

import { useEffect } from "react";
import HotelResults from "@/app/components/HotelResults";

export default function HotelsResultsPage() {
  useEffect(() => {
    document.body.style.overflow = "auto";
    document.documentElement.style.overflow = "auto";
    return () => {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    };
  }, []);

  return (
    <div className="min-h-screen">
      <HotelResults />
    </div>
  );
}
