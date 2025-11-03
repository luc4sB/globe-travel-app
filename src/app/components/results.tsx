"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, Clock, ArrowRight, Plane } from "lucide-react";
import Image from "next/image";

type Flight = {
  price: string;
  airline?: string;
  flight_number?: string;
  duration?: string;
  segments?: any[];
  link?: string | null;
};

export default function Results() {
  const params = useSearchParams();
  const [flights, setFlights] = useState<Flight[]>([]);
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

  const getAirlineInitials = (airline: string) => {
    const words = airline.split(" ");
    return words.length === 1
      ? airline.slice(0, 2).toUpperCase()
      : (words[0][0] + words[1][0]).toUpperCase();
  };

  const getAirlineLogo = (airline?: string) => {
    if (!airline) {
      return (
        <div className="w-10 h-10 rounded-full bg-sky-600/20 flex items-center justify-center text-sky-300 font-semibold text-sm">
          ??
        </div>
      );
    }

    const cleanName = airline.toLowerCase().replace(/\s+/g, "-");
    const logoUrl = `https://content.airhex.com/content/logos/airlines_${cleanName}_200_200_r.png?proportion=keep`;

    return (
      <div className="relative w-10 h-10 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
        <Image
          src={logoUrl}
          alt={airline}
          fill
          className="object-contain p-1"
          onError={(e) => {
            const img = e.target as HTMLImageElement;
            img.style.display = "none";
          }}
        />
        <span className="absolute text-sm font-bold text-sky-400">
          {getAirlineInitials(airline)}
        </span>
      </div>
    );
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-500 dark:text-gray-300">
        <Loader2 className="animate-spin mr-2" /> Searching flights...
      </div>
    );

  return (
    <main className="h-screen overflow-y-auto w-full bg-gradient-to-b from-zinc-950 via-zinc-900 to-black text-gray-100">
      {/* Sticky navbar */}
      <div className="sticky top-0 z-40 backdrop-blur-md bg-black/20 border-b border-white/10 py-4">
        <h1 className="text-center text-2xl font-semibold text-white">
          ✈️ Flights from{" "}
          <span className="text-sky-400">{origin}</span> →{" "}
          <span className="text-sky-400">{destination}</span>
        </h1>
      </div>

      {/* Scrollable content */}
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-8 pb-24">
        {flights.length === 0 ? (
          <p className="text-center text-gray-400">
            No flights found. Try different dates or airports.
          </p>
        ) : (
          <div className="grid gap-6">
            {flights.map((f, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 
                           hover:border-sky-400/40 hover:shadow-lg hover:shadow-sky-500/10 
                           transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getAirlineLogo(f.airline)}
                    <div>
                      <h2 className="text-lg font-semibold text-white">
                        {f.airline || "Unknown Airline"}
                      </h2>
                      {f.flight_number && (
                        <p className="text-sm text-gray-400">
                          Flight {f.flight_number}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-sky-400">
                      {f.price}
                    </span>
                    <p className="text-xs text-gray-400 mt-1">GBP</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <Clock size={15} />
                    <span>{f.duration || "Duration unknown"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-gray-300">{origin}</span>
                    <ArrowRight size={16} className="text-sky-400" />
                    <span className="font-mono text-gray-300">
                      {destination}
                    </span>
                  </div>
                </div>

                {Array.isArray(f.segments) && f.segments.length > 0 && (
                  <div className="mt-4 space-y-1 text-xs text-gray-500">
                    {f.segments.map((s, j) => (
                      <div
                        key={j}
                        className="flex justify-between border-b border-white/5 pb-1"
                      >
                        <p>
                          <Plane
                            size={10}
                            className="inline mr-1 text-sky-400"
                          />
                          {s.airline} {s.number}
                        </p>
                        <p>
                          {s.departure_airport} → {s.arrival_airport}{" "}
                          <span className="text-gray-400 ml-1">
                            ({s.duration})
                          </span>
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {f.link && (
                  <div className="mt-6 text-right">
                    <a
                      href={f.link}
                      target="_blank"
                      className="inline-block px-5 py-2 text-sm rounded-xl bg-sky-500 hover:bg-sky-600 
                                 text-white font-medium transition-all shadow-md hover:shadow-sky-400/30"
                    >
                      Book Flight →
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
