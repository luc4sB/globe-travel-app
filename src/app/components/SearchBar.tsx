"use client";

import { useState } from "react";

interface SearchBarProps {
  setFlights: (flights: any) => void;
}

export default function SearchBar({ setFlights }: SearchBarProps) {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");

  const handleSearch = () => {
    // Placeholder: simulate API response
    setFlights([
      {
        itineraries: [{ segments: [{ departure: { iataCode: origin }, arrival: { iataCode: destination } }] }],
        price: { total: "100", currency: "USD" },
      },
    ]);
  };

  return (
    <div className="flex gap-2 my-4">
      <input
        placeholder="Origin (IATA)"
        value={origin}
        onChange={(e) => setOrigin(e.target.value.toUpperCase())}
        className="border p-2 rounded"
      />
      <input
        placeholder="Destination (IATA)"
        value={destination}
        onChange={(e) => setDestination(e.target.value.toUpperCase())}
        className="border p-2 rounded"
      />
      <button
        onClick={handleSearch}
        className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
      >
        Search
      </button>
    </div>
  );
}
