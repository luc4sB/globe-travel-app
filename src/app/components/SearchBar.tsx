"use client";

import { useState } from "react";

interface SearchBarProps {
  setFlights: (flights: any) => void;
}

export default function SearchBar({ setFlights }: SearchBarProps) {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState("");

  const handleSearch = async () => {
    if (!origin || !destination) {
      alert("Please enter origin and destination airports");
      return;
    }

    try {
      const res = await fetch("/api/flights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin: origin.toUpperCase(),
          destination: destination.toUpperCase(),
          departureDate: "2025-11-01", // Temporary — will add date picker later
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setFlights(data.flights || []);
    } catch (err: any) {
      console.error(err);
      alert("Failed to fetch flights");
    }
  };

  return (
    <div className="flex gap-2 my-4">
      <input
        type="date"
        className="border rounded p-2"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />
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
