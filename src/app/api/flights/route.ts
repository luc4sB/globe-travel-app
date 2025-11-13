import { NextResponse } from "next/server";

const SERPAPI_KEY = process.env.SERPAPI_KEY!;

/* ------------------------- PRICE NORMALISER ------------------------- */
function normalizePrice(p: any): string | null {
  if (!p) return null;

  if (typeof p === "string") {
    const num = p.replace(/[^\d]/g, "");
    return num ? `£${num}` : null;
  }

  if (typeof p === "number") {
    return `£${p}`;
  }

  if (typeof p === "object") {
    if (p.formatted) return p.formatted;        
    if (p.raw) return `£${p.raw}`;              
    if (p.amount) return `£${p.amount}`;
    if (p.rounded_price) return `£${p.rounded_price}`;
  }

  return null;
}

/* ------------------------- DURATION HELPERS ------------------------- */
function minutesToHM(minutes: number | null): string {
  if (!minutes || isNaN(minutes)) return "Unknown";

  const h = Math.floor(minutes / 60);
  const m = minutes % 60;

  if (!h) return `${m}m`;
  if (!m) return `${h}h`;
  return `${h}h ${m}m`;
}

export async function POST(req: Request) {
  try {
    const {
      origin,
      destination,
      departureDate,
      returnDate,
      currency,
      tripType,
    } = await req.json();

    if (!origin || !destination || !departureDate) {
      return NextResponse.json(
        { error: "Missing parameters: origin, destination, or departureDate" },
        { status: 400 }
      );
    }

    /* ---------------------- Build Request ---------------------- */
    const params = new URLSearchParams({
      engine: "google_flights",
      api_key: SERPAPI_KEY,
      departure_id: origin.toUpperCase(),
      arrival_id: destination.toUpperCase(),
      outbound_date: departureDate,
      currency: currency || "GBP",
      hl: "en",
      flexible_date: "true",
    });

    params.set("type", tripType === "return" ? "1" : "2");
    if (tripType === "return" && returnDate) {
      params.set("return_date", returnDate);
    }

    const url = `https://serpapi.com/search?${params.toString()}`;
    console.log("SerpApi URL:", url);

    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "SerpApi error");
    }

    /* ---------------------------- Extract Flights ---------------------------- */
    const allFlights = [
      ...(data.best_flights || []),
      ...(data.other_flights || []),
    ];

    const flights = allFlights.map((f: any) => {
      const priceStr = normalizePrice(f.price);

      const totalMinutes = f.total_duration ?? null;

      return {
        airline: f.flights?.[0]?.airline || "Unknown Airline",
        flight_number: f.flights?.[0]?.flight_number || "",

        /* Duration fields */
        duration_hm: minutesToHM(totalMinutes),
        duration_min: totalMinutes ?? Infinity,

        /* Price fields */
        price: priceStr ?? "Price unavailable",
        price_value: priceStr
          ? parseInt(priceStr.replace(/[^\d]/g, ""), 10)
          : Infinity,

        /* Segments */
        segments: (f.flights || []).map((seg: any) => ({
          airline: seg.airline,
          number: seg.flight_number,
          departure_airport: seg.departure_airport?.id,
          arrival_airport: seg.arrival_airport?.id,

          duration_hm: seg.duration ? minutesToHM(seg.duration) : "",
          duration_min: seg.duration ?? Infinity,
        })),

        link: data.search_metadata?.google_flights_url || null,
      };
    });

    return NextResponse.json({
      flights,
      meta: {
        origin,
        destination,
        departureDate,
        returnDate: returnDate || null,
        tripType,
        total: flights.length,
      },
    });
  } catch (err: any) {
    console.error("SerpApi Flights API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
