import { NextResponse } from "next/server";

export const runtime = "edge";

const defaultImages = ["/fallbacks/landscape.jpg"];

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
  const city = searchParams.get("city");

  if (!city) return NextResponse.json({ urls: defaultImages });

  const PEXELS_KEY = process.env.NEXT_PUBLIC_PEXELS_KEY;
  if (!PEXELS_KEY) {
    return NextResponse.json({ urls: defaultImages, error: "Missing API key" });
  }

  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(
        city + " city skyline"
      )}&orientation=landscape&per_page=12`,
      { headers: { Authorization: PEXELS_KEY } }
    );

    if (!res.ok) throw new Error("Pexels API error");

    const data = await res.json();
    const photos: any[] = data.photos || [];

    const validImages: string[] = [];
    for (const p of photos) {
      const img = p?.src?.landscape || p?.src?.large2x || p?.src?.original;
      if (!img) continue;
      const text = `${p.alt || ""} ${p.photographer || ""}`;
      if (containsPhrase(text, city) || validImages.length === 0) {
        validImages.push(img);
      }
      if (validImages.length >= 4) break;
    }

    return NextResponse.json({
      urls: validImages.length ? validImages : defaultImages,
      meta: { city },
    });
  } catch {
    return NextResponse.json({ urls: defaultImages });
  }
}
