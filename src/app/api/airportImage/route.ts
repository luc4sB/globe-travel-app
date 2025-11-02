import { NextResponse } from "next/server";

export const runtime = "edge";

const defaultImage = "/fallbacks/landscape.jpg";

function normalize(s: string) {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^0-9A-Za-z]+/g, " ")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function containsPhrase(haystack: string, needle: string) {
  const h = ` ${normalize(haystack)} `;
  const n = ` ${normalize(needle)} `;
  return h.includes(n);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rawQuery = searchParams.get("query");
  if (!rawQuery) return NextResponse.json({ image: defaultImage });

  const PEXELS_KEY = process.env.NEXT_PUBLIC_PEXELS_KEY;
  if (!PEXELS_KEY)
    return NextResponse.json({ image: defaultImage, error: "Missing API key" });

  let cityQuery = rawQuery
    .replace(/(international|intl|airport|terminal|airfield|air base)/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  cityQuery = cityQuery.split(" ")[0];

  console.log("🧭 Cleaned Pexels query:", cityQuery);

  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(
        cityQuery
      )}&orientation=landscape&per_page=8`,
      { headers: { Authorization: PEXELS_KEY } }
    );

    if (!res.ok) throw new Error("Pexels API error");
    const data = await res.json();
    const photos: any[] = data.photos || [];

    if (!photos.length) return NextResponse.json({ image: defaultImage });

    let bestImage: string | null = null;
    for (const p of photos) {
      const img = p?.src?.landscape || p?.src?.large2x || p?.src?.original;
      if (!img) continue;
      const text = `${p.alt || ""} ${p.photographer || ""}`;
      if (containsPhrase(text, cityQuery)) {
        bestImage = img;
        break;
      }
    }

    if (!bestImage && photos[0]) {
      bestImage =
        photos[0]?.src?.landscape ||
        photos[0]?.src?.large2x ||
        photos[0]?.src?.original;
    }

    return NextResponse.json({ image: bestImage || defaultImage });
  } catch (err) {
    console.error("Pexels API city error:", err);
    return NextResponse.json({ image: defaultImage });
  }
}
