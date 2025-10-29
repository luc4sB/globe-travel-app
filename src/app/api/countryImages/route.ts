import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name");
  if (!name) return NextResponse.json({ urls: [] });

  const PEXELS_KEY = process.env.NEXT_PUBLIC_PEXELS_KEY;
  if (!PEXELS_KEY)
    return NextResponse.json({
      urls: ["/fallbacks/landscape.jpg"],
      error: "No Pexels key",
    });

  try {
    const query = `${name} landscape travel`;
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(
        query
      )}&per_page=10&orientation=landscape`,
      {
        headers: { Authorization: PEXELS_KEY },
        next: { revalidate: 60 * 60 * 24 }, // cache for 1 day
      }
    );

    if (!res.ok) throw new Error("Pexels failed");
    const data = await res.json();

    // --- ✅ Filter out unwanted map/flag/illustration images ---
    const filtered = (data.photos || []).filter((p: any) => {
      const desc = (p.alt || "").toLowerCase();
      return (
        !desc.includes("map") &&
        !desc.includes("flag") &&
        !desc.includes("illustration") &&
        !desc.includes("pin") &&
        !desc.includes("poster") &&
        !desc.includes("vector") &&
        !desc.includes("infographic")
      );
    });

    // --- ✅ Prioritize scenic images ---
    const scenicWords = [
      "mountain",
      "coast",
      "lake",
      "river",
      "forest",
      "beach",
      "desert",
      "landscape",
      "nature",
      "waterfall",
      "island",
    ];

    const sorted = filtered.sort((a: any, b: any) => {
      const aDesc = (a.alt || "").toLowerCase();
      const bDesc = (b.alt || "").toLowerCase();
      const aScore = scenicWords.some((w) => aDesc.includes(w)) ? 1 : 0;
      const bScore = scenicWords.some((w) => bDesc.includes(w)) ? 1 : 0;
      return bScore - aScore; // scenic images first
    });

    // --- ✅ Extract usable image URLs ---
    const urls = sorted.map((p: any) => p.src.large).slice(0, 5);

    return NextResponse.json({
      urls: urls.length ? urls : ["/fallbacks/landscape.jpg"],
    });
  } catch (err) {
    console.error("❌ Image fetch failed:", err);
    return NextResponse.json({ urls: ["/fallbacks/landscape.jpg"] });
  }
}
