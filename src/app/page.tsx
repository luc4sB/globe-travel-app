"use client";

import Globe from "./components/Globe";
import { useState } from "react";

export default function Home() {
  const [flights, setFlights] = useState<any[]>([]);

  return (
    <main className="relative w-full text-white">
      <div className="w-full" style={{ height: "calc(100dvh - var(--nav-h) - var(--bottom-nav-h))" }}>        <Globe />
      </div>
    </main>
  );
}
