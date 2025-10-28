import { NextResponse } from "next/server";

const capitalMap: Record<string, string> = {
  "Fiji": "Suva",
  "Australia": "Sydney",
  "Japan": "Tokyo",
  "France": "Paris",
  "Italy": "Rome",
  "United Kingdom": "London",
  "Canada": "Toronto",
  "China": "Beijing",
  "Egypt": "Cairo",
  "Brazil": "Rio de Janeiro",
  "India": "Delhi",
  "United States": "New York City",
  "Mexico": "Mexico City",
  "Indonesia": "Bali",
  "Thailand": "Bangkok",
  "Greece": "Athens",
  "Spain": "Madrid",
  "Turkey": "Istanbul",
  "South Africa": "Cape Town",
};

const islandKeywords = [
  "island", "beach", "coast", "tropical", "sea", "ocean", "resort",
];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name");
  if (!name) return NextResponse.json({ urls: [] });

  const PEXELS_KEY = process.env.NEXT_PUBLIC_PEXELS_KEY;
  if (!PEXELS_KEY) {
    console.error("⚠️ Missing Pexels API key");
    return NextResponse.json({ urls: [] });
  }

  // Pick capital or fallback
  const capital = capitalMap[name] || name;
  const queryBase = `${capital}, ${name}`;
  const isIsland = islandKeywords.some((k) =>
    name.toLowerCase().includes(k.toLowerCase())
  );

  // Stronger context query for more scenic/travel-like images
  const query = `${queryBase} ${
    isIsland
      ? "beach tropical landscape nature coast travel"
      : "landscape nature mountains architecture travel"
  }`;

  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(
        query
      )}&per_page=12&orientation=landscape`,
      {
        headers: {
          Authorization: PEXELS_KEY,
        },
      }
    );

    if (!res.ok) throw new Error(`Pexels API error: ${res.status}`);
    const data = await res.json();

    // Filter: wide, scenic, and no people/portraits/cities
    const urls =
      (data.photos || [])
        .filter((photo: any) => {
          const ratio = photo.width / photo.height;
          const desc = `${photo.alt || ""}`.toLowerCase();
          return (
            ratio > 1.3 && // wide shot
            !desc.includes("portrait") &&
            !desc.includes("model") &&
            !desc.includes("person") &&
            !desc.includes("selfie") &&
            !desc.includes("wedding") &&
            !desc.includes("business") &&
            !desc.includes("city skyline")
          );
        })
        .map((photo: any) => photo.src.large)
        .slice(0, 8);

    return NextResponse.json({ urls });
  } catch (err) {
    console.error("❌ Failed to fetch Pexels images:", err);
    return NextResponse.json({ urls: [] });
  }
}
