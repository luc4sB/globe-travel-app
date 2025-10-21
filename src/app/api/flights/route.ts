import { NextResponse } from "next/server";
// @ts-expect-error - amadeus SDK has no type declarations
import Amadeus from "amadeus";

const amadeus = new Amadeus({
  clientId: process.env.AMADEUS_CLIENT_ID!,
  clientSecret: process.env.AMADEUS_CLIENT_SECRET!,
});

export async function POST(req: Request) {
  try {
    const { origin, destination, departureDate } = await req.json();

    if (!origin || !destination || !departureDate) {
      return NextResponse.json(
        { error: "Missing parameters" },
        { status: 400 },
      );
    }

    const response = await amadeus.shopping.flightOffersSearch.get({
      originLocationCode: origin,
      destinationLocationCode: destination,
      departureDate, // ✅ use the variable from the JSON body
      adults: "1",
      max: "5",
    });

    const flights = JSON.parse(response.body).data;
    return NextResponse.json({ flights });
  } catch (err: any) {
    console.error("Amadeus error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
