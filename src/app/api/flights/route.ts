import { NextResponse } from "next/server";

const SERPAPI_KEY = process.env.SERPAPI_KEY!;

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

    // Trip type: 1 = round trip, 2 = one way
    params.set("type", tripType === "return" ? "1" : "2");

    if (tripType === "return" && returnDate) {
      params.set("return_date", returnDate);
    }

    const url = `https://serpapi.com/search?${params.toString()}`;
    console.log("SerpApi URL:", url);

    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok) {
      const message = data.error || "SerpApi error";
      throw new Error(message);
    }
    const allFlights = [
      ...(data.best_flights || []),
      ...(data.other_flights || []),
    ];
    const flights = allFlights.map((f: any) => ({
      airline: f.flights?.[0]?.airline || "Unknown Airline",
      flight_number: f.flights?.[0]?.flight_number || "",
      duration: f.total_duration ? `${f.total_duration} min` : "Unknown",
      price: f.price ? `${f.price}` : "—",
      segments: (f.flights || []).map((seg: any) => ({
        airline: seg.airline,
        number: seg.flight_number,
        departure_airport: seg.departure_airport?.id,
        arrival_airport: seg.arrival_airport?.id,
        duration: seg.duration ? `${seg.duration} min` : "",
      })),
      link: data.search_metadata?.google_flights_url || null,
      logo: f.airline_logo || null,
    }));

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
    console.error("❌ SerpApi Flights API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
