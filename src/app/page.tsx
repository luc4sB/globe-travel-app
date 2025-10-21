"use client";
import ThemeToggle from "./components/themeToggle";
import Globe from "./components/Globe";
import SearchBar from "./components/SearchBar";
import FlightResults from "./components/FlightResults";
import { useState } from "react";
import BackgroundStars from "./components/BackgroundStars";
import BackgroundDay from "./components/BackgroundDay";

export default function Home() {
  const [flights, setFlights] = useState<any[]>([]);

  return (
    <main className="flex flex-col items-center p-4 min-h-screen text-white">
      <BackgroundDay />
      <BackgroundStars />
      <ThemeToggle />

      <header className="py-4 text-center">
        <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-300">
          🌍 Global Travel App
        </h1>
      </header>

      <section className="w-full py-8">
        <div className="max-w-5xl mx-auto">
          <Globe />
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 py-6">
        <SearchBar setFlights={setFlights} />
        <FlightResults flights={flights} />
      </section>
    </main>
  );
}
