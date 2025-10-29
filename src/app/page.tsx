"use client";

import Globe from "./components/Globe";
import SearchBar from "./components/SearchBar";
import FlightResults from "./components/FlightResults";
import { useState } from "react";

export default function Home() {
  const [flights, setFlights] = useState<any[]>([]);

  return (
    <main className="flex flex-col items-center min-h-screen text-white">
      {/* Globe section - pulled closer to the navbar */}
      <section className="w-full pt-6">
        <div className="max-w-5xl mx-auto -mt-6">
          <Globe />
        </div>
      </section>

      
    </main>
  );
}
