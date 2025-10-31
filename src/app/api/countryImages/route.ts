import { NextResponse } from "next/server";

// Regional + City hints for better landscape context
const regionalHints: Record<string, string> = {
  Italy: "Rome Venice Florence coast mountains travel",
  France: "Paris Provence Alps Riviera travel",
  Spain: "Barcelona Madrid Andalusia beaches travel",
  "North Korea": "East Asia mountains Korea",
  Syria: "Middle East desert",
  Iran: "Persia mountains desert",
  Iraq: "Middle East landscape",
  Greenland: "Arctic ice snow",
  Mongolia: "steppe mountains",
  Afghanistan: "Central Asia mountains",
};

// Words to filter out unwanted results
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

  //Prepare multiple related queries to improve coverage
  const base = `${name} ${regionalHints[name] || ""}`.trim();
  const queries: string[] = [
    `${base} landscape travel nature`,
    `${name} scenic view travel photography`,
    `${name} countryside coast mountains nature`,
  ];

  async function fetchImages(query: string) {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=8&orientation=landscape`,
      {
        headers: { Authorization: PEXELS_KEY as string }, // assert type
        next: { revalidate: 86400 }, // cache 1 day
      }
    );
    if (!res.ok) throw new Error("Pexels API error");
    return res.json();
  }

  try {
    //Run all queries in parallel
    const results = await Promise.allSettled(queries.map(fetchImages));

    //Flatten all successful results
    const allPhotos = results
      .filter((r): r is PromiseFulfilledResult<any> => r.status === "fulfilled")
      .flatMap((r) => r.value.photos || [])
      .filter(Boolean);

    //Filter, randomise, and deduplicate by photographer
    const seenUrls = new Set<string>();
    const seenAuthors = new Set<string>();
    let urls: string[] = [];

    const shuffled = allPhotos.sort(() => Math.random() - 0.5);

    for (const p of shuffled) {
      const alt = (p.alt || "").toLowerCase();
      if (blocked.some((w) => alt.includes(w))) continue;

      const author = (p.photographer || "").toLowerCase();
      const img = p.src.landscape || p.src.large2x || p.src.original;
      if (!img || seenUrls.has(img)) continue;

      // ensure only one photo per author for variety
      if (seenAuthors.has(author)) continue;

      seenAuthors.add(author);
      seenUrls.add(img);
      urls.push(img);

      if (urls.length >= 4) break;
    }

    // Relax restriction if too few unique authors
    if (urls.length < 3) {
      for (const p of allPhotos) {
        const img = p.src.landscape || p.src.large2x || p.src.original;
        if (!img || seenUrls.has(img)) continue;
        seenUrls.add(img);
        urls.push(img);
        if (urls.length >= 4) break;
      }
    }

    // ✅ Return results or fallback
    return NextResponse.json({
      urls: urls.length ? urls : ["/fallbacks/landscape.jpg"],
    });
  } catch (err) {
    console.error("❌ image fetch failed:", err);
    return NextResponse.json({ urls: ["/fallbacks/landscape.jpg"] });
  }
}
