"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function FlightResults() {
  const params = useSearchParams();
  const [flights, setFlights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const origin = params.get("origin");
  const destination = params.get("destination");
  const departDate = params.get("departDate");
  const returnDate = params.get("returnDate");
  const tripType = params.get("tripType") || "oneway";

  useEffect(() => {
    if (!origin || !destination || !departDate) return;

    const fetchFlights = async () => {
      try {
        const res = await fetch("/api/flights", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            origin,
            destination,
            departureDate: departDate,
            returnDate,
            tripType,
            currency: "GBP",
          }),
        });
        const data = await res.json();
        setFlights(data.flights || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchFlights();
  }, [origin, destination, departDate, returnDate, tripType]);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-500 dark:text-gray-300">
        <Loader2 className="animate-spin mr-2" /> Searching flights...
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 p-6">
      <h1 className="text-3xl font-semibold mb-6 text-gray-900 dark:text-white">
        Flights from {origin} → {destination}
      </h1>

      {flights.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No flights found.</p>
      ) : (
        <div className="grid gap-4">
          {flights.map((f, i) => (
            <div
              key={i}
              className="rounded-lg bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-4 shadow-sm hover:shadow-md transition"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                    {f.airline || "Unknown airline"}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {f.flight_number} • {f.duration}
                  </p>
                </div>
                <span className="text-blue-600 font-bold text-lg">{f.price}</span>
              </div>
              {f.link && (
                <a
                  href={f.link}
                  target="_blank"
                  className="mt-3 inline-block text-sm text-blue-500 hover:text-blue-600"
                >
                  Book →
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
