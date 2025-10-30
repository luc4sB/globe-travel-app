import { NextResponse } from "next/server";

// 🌍 Regional + City hints (adds context for generic countries)
const regionalHints: Record<string, string> = {
  "Italy": "Rome Venice Florence coast mountains travel",
  "France": "Paris Provence Alps Riviera travel",
  "Spain": "Barcelona Madrid Andalusia beaches travel",
  "North Korea": "East Asia mountains Korea",
  "Syria": "Middle East desert",
  "Iran": "Persia mountains desert",
  "Iraq": "Middle East landscape",
  "Greenland": "Arctic ice snow",
  "Mongolia": "steppe mountains",
  "Afghanistan": "Central Asia mountains",
};

// 🚫 Words to filter out unwanted results
const blocked = [
  "norway", "iceland", "sweden", "finland",
  "swiss", "alps", "canada", "scotland", "ireland",
];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name");
  if (!name) return NextResponse.json({ urls: [] });

  const PEXELS_KEY = process.env.NEXT_PUBLIC_PEXELS_KEY;
  if (!PEXELS_KEY) {
    return NextResponse.json({
      urls: ["/fallbacks/landscape.jpg"],
      error: "Missing Pexels key",
    });
  }

  const baseQuery = `${name} ${regionalHints[name] || "landscape travel nature"}`;
async function fetchImages(query: string) {
  const res = await fetch(
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=8&orientation=landscape`,
    {
      headers: { Authorization: `${PEXELS_KEY}` },
      next: { revalidate: 60 * 60 * 24 }, // cache 1 day
    }
  );
  if (!res.ok) throw new Error("Pexels API error");
  return res.json();
}


  try {
    // 1️⃣ Fast primary fetch
    let data = await fetchImages(baseQuery);

    // 2️⃣ City-based fallback only if few results
    if ((!data.photos || data.photos.length < 3) && regionalHints[name]) {
      const altQuery = `${name} travel photography nature`;
      const fallbackData = await fetchImages(altQuery);
      if (fallbackData.photos?.length > data.photos?.length) data = fallbackData;
    }

    // 3️⃣ Inline filtering and deduplication
    const seen = new Set<string>();
    const urls: string[] = [];
    for (const p of data.photos || []) {
      const alt = (p.alt || "").toLowerCase();
      const author = (p.photographer || "").toLowerCase();
      if (blocked.some((w) => new RegExp(`\\b${w}\\b`, "i").test(alt))) continue;
      if (seen.has(author)) continue;
      seen.add(author);
      urls.push(p.src.landscape || p.src.large2x || p.src.original);
      if (urls.length >= 4) break;
    }

    // 4️⃣ Final fallback image if nothing good
    return NextResponse.json({
      urls: urls.length ? urls : ["/fallbacks/landscape.jpg"],
    });
  } catch (err) {
    console.error("❌ image fetch failed:", err);
    return NextResponse.json({ urls: ["/fallbacks/landscape.jpg"] });
  }
}
