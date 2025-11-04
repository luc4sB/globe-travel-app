import { NextResponse } from "next/server";

const SERPAPI_KEY = process.env.SERPAPI_KEY!;


export async function POST(req: Request) {
  try {
    const { city, checkIn, checkOut, currency = "GBP", adults = 2 } = await req.json();

    if (!city || !checkIn || !checkOut) {
      return NextResponse.json(
        { error: "Missing required parameters: city, checkIn, checkOut" },
        { status: 400 }
      );
    }

    const params = new URLSearchParams({
      engine: "google_hotels",
      q: city,
      check_in_date: checkIn,
      check_out_date: checkOut,
      currency,
      adults: String(adults),
      api_key: SERPAPI_KEY,
      hl: "en",
    });

    const url = `https://serpapi.com/search?${params.toString()}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "SerpApi error");
    }

    const properties = Array.isArray(data.properties) ? data.properties : [];

    //Normalise results using the first available image
    const hotels = properties.map((p: any) => {
      // get image from p.thumbnail or first image in p.images
      const imageUrl =
        p.thumbnail ||
        p.images?.[0]?.thumbnail ||
        p.images?.[0]?.original_image ||
        null;

      return {
        name: p.name || "Unnamed Property",
        rating: p.overall_rating || p.rating || null,
        reviews: p.reviews || null,
        price:
          p.rate_per_night?.lowest ||
          p.extracted_price ||
          p.price ||
          null,
        total:
          p.total_price ||
          p.total_rate?.lowest ||
          null,
        thumbnail: imageUrl,
        address: p.address?.formatted_address || p.address || null,
        amenities: Array.isArray(p.amenities)
          ? p.amenities
          : Array.isArray(p.key_amenities)
          ? p.key_amenities
          : [],
        link:
          p.link ||
          p.serpapi_property_details_link ||
          data.search_metadata?.google_hotels_url ||
          null,
      };
    });

    console.log(`Normalised ${hotels.length} hotel results for ${city}:`);
    console.dir(hotels.slice(0, 3), { depth: null });

    return NextResponse.json({
      hotels,
      meta: {
        city,
        checkIn,
        checkOut,
        total: hotels.length,
      },
    });
  } catch (err: any) {
    console.error("Hotel API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
