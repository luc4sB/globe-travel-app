"use client";

import Globe from "./components/Globe";
import { useState } from "react";

export default function Home() {
  const [flights, setFlights] = useState<any[]>([]);

  return (
    <main
      className="relative w-full text-white"
      style={{
        paddingTop: "0px",
        height: "100vh",
      }}
    >
      <div className="w-full h-[calc(100vh-70px)]">
        <Globe />
      </div>
    </main>
  );
}
