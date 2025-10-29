import { NextResponse } from "next/server";

// Light regional hints for weak countries
const regionalHints: Record<string, string> = {
  "North Korea": "East Asia mountains Korea",
  "Syria": "Middle East desert",
  "Iran": "Persia mountains desert",
  "Iraq": "Middle East landscape",
  "Greenland": "Arctic ice snow",
  "Mongolia": "steppe mountains",
  "Afghanistan": "Central Asia mountains",
};

const blocked = [
  "norway", "iceland", "sweden", "finland",
  "swiss", "alps", "canada", "scotland", "ireland",
];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name");
  if (!name) return NextResponse.json({ urls: [] });

  const PEXELS_KEY = process.env.NEXT_PUBLIC_PEXELS_KEY;
  if (!PEXELS_KEY)
    return NextResponse.json({
      urls: ["/fallbacks/landscape.jpg"],
      error: "Missing Pexels key",
    });

  const query = `${name} ${regionalHints[name] || "landscape travel nature"}`;

  try {
    // 1️⃣ single short fetch, cached for a day
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(
        query
      )}&per_page=8&orientation=landscape`,
      {
        headers: { Authorization: PEXELS_KEY },
        next: { revalidate: 60 * 60 * 24 },
      }
    );
    if (!res.ok) throw new Error("Pexels API error");

    const data = await res.json();
    const photos = data.photos || [];

    // 2️⃣ fast inline filtering
    const seen = new Set<string>();
    const urls: string[] = [];
    for (const p of photos) {
      const alt = (p.alt || "").toLowerCase();
      const author = (p.photographer || "").toLowerCase();
      if (blocked.some((w) => alt.includes(w))) continue;
      if (seen.has(author)) continue;
      seen.add(author);
      urls.push(p.src.large);
      if (urls.length >= 4) break; // small, fast result
    }

    // 3️⃣ simple fallback
    return NextResponse.json({
      urls: urls.length ? urls : ["/fallbacks/landscape.jpg"],
    });
  } catch (err) {
    console.error("❌ image fetch failed:", err);
    return NextResponse.json({ urls: ["/fallbacks/landscape.jpg"] });
  }
}
