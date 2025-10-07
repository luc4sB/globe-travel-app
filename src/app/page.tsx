"use client";

import Globe from './components/Globe';
import SearchBar from './components/SearchBar';
import FlightResults from './components/FlightResults';
import { useState } from 'react';

export default function Home() {
  const [flights, setFlights] = useState([]);

  return (
    <main className="flex flex-col items-center p-4 min-h-screen bg-black text-white">

      <h1 className="text-3xl font-bold text-center text-blue-500">🌍 Globe Travel App</h1>
      <Globe />
      <SearchBar setFlights={setFlights} />
      <FlightResults flights={flights} />
    </main>
  );
}
