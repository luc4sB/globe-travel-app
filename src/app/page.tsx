"use client";

import Globe from "./components/Globe";
import { useState } from "react";

export default function Home() {
  const [flights, setFlights] = useState<any[]>([]);

  
  return (

    <main className="flex flex-col items-center justify-center min-h-screen text-white relative">
      <div className="w-full h-full">
        <Globe />
      </div>
    </main>
  );
}
