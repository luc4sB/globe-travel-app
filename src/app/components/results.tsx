"use client";

import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, Clock, ArrowRight, Plane } from "lucide-react";
import Image from "next/image";

type Segment = {
  airline?: string;
  number?: string;
  departure_airport?: string;
  arrival_airport?: string;

  duration_hm: string;
  duration_min: number;
};

type Flight = {
  price: string;          
  price_value: number;    

  airline?: string;
  flight_number?: string;

  duration_hm: string;    
  duration_min: number;   

  segments: Segment[];
  link?: string | null;
};

/* Split segments into outbound / inbound */
const splitSegmentsByDirection = (
  segments: Segment[],
  origin: string,
  destination: string
) => {
  const outbound: Segment[] = [];
  const inbound: Segment[] = [];

  let reachedDestination = false;

  for (const s of segments) {
    if (!reachedDestination) {
      outbound.push(s);
      if (s.arrival_airport === destination) {
        reachedDestination = true;
      }
    } else inbound.push(s);
  }

  return { outbound, inbound };
};

const getAirlineInitials = (airline: string) => {
  const words = airline.split(" ");
  return words.length === 1
    ? airline.slice(0, 2).toUpperCase()
    : (words[0][0] + words[1][0]).toUpperCase();
};

const getAirlineLogo = (airline?: string) => {
  if (!airline)
    return (
      <div className="w-10 h-10 rounded-full bg-sky-600/20 flex items-center justify-center text-sky-300 font-semibold text-sm">
        ??
      </div>
    );

  const cleanName = airline.toLowerCase().replace(/\s+/g, "-");
  const logoUrl = `https://content.airhex.com/content/logos/airlines_${cleanName}_200_200_r.png?proportion=keep`;

  return (
    <div className="relative w-10 h-10 rounded-full bg-white/10 overflow-hidden flex items-center justify-center">
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
      <span className="absolute text-xs font-bold text-sky-400">
        {getAirlineInitials(airline)}
      </span>
    </div>
  );
};

type SortMode = "best" | "price" | "duration";

export default function Results() {
  const params = useSearchParams();

  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortMode, setSortMode] = useState<SortMode>("best");

  const origin = params.get("origin") || "";
  const destination = params.get("destination") || "";
  const departDate = params.get("departDate") || "";
  const returnDate = params.get("returnDate") || "";
  const tripType = params.get("tripType") || "oneway";

  useEffect(() => {
    if (!origin || !destination || !departDate) return;

    const fetchFlights = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/flights", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            origin,
            destination,
            departureDate: departDate,
            returnDate: returnDate || undefined,
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

  /* -------- Sort with numeric values -------- */
  const sortedFlights = useMemo(() => {
    const enhanced = flights.map((f) => ({
      ...f,
      _price: f.price_value,
      _duration: f.duration_min,
    }));

    return enhanced.sort((a, b) => {
      if (sortMode === "price") return a._price - b._price;
      if (sortMode === "duration") return a._duration - b._duration;

      // best: price first, then duration
      if (a._price !== b._price) return a._price - b._price;
      return a._duration - b._duration;
    });
  }, [flights, sortMode]);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-300">
        <Loader2 className="animate-spin mr-2" /> Searching flights...
      </div>
    );

  return (
    <main className="h-screen overflow-y-auto bg-gradient-to-b from-zinc-950 via-zinc-900 to-black text-gray-100">
      {/* Header */}
      <div className="sticky top-0 z-40 backdrop-blur-md bg-black/40 border-b border-white/10 py-4">
        <h1 className="text-center text-2xl font-semibold">
          ✈️ {tripType === "return" ? "Return flights" : "Flights"} from{" "}
          <span className="text-sky-400">{origin}</span> →{" "}
          <span className="text-sky-400">{destination}</span>
        </h1>
        <p className="text-center text-xs text-gray-400 mt-1">
          {departDate}
          {tripType === "return" && returnDate && (
            <>
              {" · Return: "}
              <span className="text-gray-300">{returnDate}</span>
            </>
          )}
        </p>
      </div>

      {/* Main content */}
      <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">
        {/* Sorting bar */}
        {sortedFlights.length > 0 && (
          <div className="flex justify-between items-center text-xs mb-2">
            <span className="text-gray-400">
              {sortedFlights.length} flights ·{" "}
              {sortMode === "best"
                ? "Best (price + time)"
                : sortMode === "price"
                ? "Cheapest"
                : "Fastest"}
            </span>

            <div className="inline-flex rounded-full bg-white/5 border border-white/10 overflow-hidden">
              {["best", "price", "duration"].map((m) => (
                <button
                  key={m}
                  onClick={() => setSortMode(m as SortMode)}
                  className={`px-3 py-1.5 text-[11px] font-medium ${
                    sortMode === m
                      ? "bg-sky-500 text-white"
                      : "text-gray-300 hover:bg-white/5"
                  }`}
                >
                  {m === "best" ? "Best" : m === "price" ? "Cheapest" : "Fastest"}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* No flights */}
        {sortedFlights.length === 0 ? (
          <p className="text-center text-gray-400 mt-10">
            No flights found. Try changing your dates.
          </p>
        ) : (
          <div className="grid gap-6">
            {sortedFlights.map((f, i) => {
              const { outbound, inbound } =
                tripType === "return"
                  ? splitSegmentsByDirection(f.segments, origin, destination)
                  : { outbound: f.segments, inbound: [] };

              return (
                <div
                  key={i}
                  className="p-6 rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 hover:border-sky-500/40 transition shadow"
                >
                  {/* Top row */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      {getAirlineLogo(f.airline)}
                      <div>
                        <h2 className="text-lg font-semibold">{f.airline}</h2>
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
                      <p className="text-xs text-gray-400">GBP · total</p>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="flex justify-between items-center mt-3 text-sm text-gray-300">
                    <div className="flex items-center gap-2">
                      <Clock size={15} />
                      {f.duration_hm}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono">{origin}</span>
                      <ArrowRight size={16} className="text-sky-400" />
                      <span className="font-mono">{destination}</span>
                      {tripType === "return" && (
                        <span className="ml-2 px-2 py-0.5 text-[10px] border border-sky-400 rounded-full">
                          Return included
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Segments */}
                  {outbound.length > 0 && (
                    <div className="mt-4">
                      <p className="text-[10px] uppercase text-gray-500 mb-1">
                        Outbound · {origin} → {destination}
                      </p>

                      {outbound.map((s, j) => (
                        <div
                          key={`o-${j}`}
                          className="flex justify-between text-xs border-b border-white/5 py-1"
                        >
                          <p>
                            <Plane size={10} className="inline mr-1 text-sky-400" />
                            {s.airline} {s.number}
                          </p>
                          <p>
                            {s.departure_airport} → {s.arrival_airport}{" "}
                            <span className="text-gray-400 ml-1">
                              ({s.duration_hm})
                            </span>
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {inbound.length > 0 && (
                    <div className="mt-4 pt-2 border-t border-white/5">
                      <p className="text-[10px] uppercase text-gray-500 mb-1">
                        Return · {destination} → {origin}
                      </p>

                      {inbound.map((s, j) => (
                        <div
                          key={`i-${j}`}
                          className="flex justify-between text-xs border-b border-white/5 py-1"
                        >
                          <p>
                            <Plane size={10} className="inline mr-1 text-sky-400" />
                            {s.airline} {s.number}
                          </p>
                          <p>
                            {s.departure_airport} → {s.arrival_airport}{" "}
                            <span className="text-gray-400 ml-1">
                              ({s.duration_hm})
                            </span>
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* CTA */}
                  {f.link && (
                    <div className="mt-4 text-right">
                      <a
                        href={f.link}
                        target="_blank"
                        className="px-5 py-2 bg-sky-500 hover:bg-sky-600 rounded-xl text-sm font-medium shadow"
                      >
                        Book Flight →
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
