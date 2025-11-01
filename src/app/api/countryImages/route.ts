import { NextResponse } from "next/server";

export const runtime = "edge";

const defaultImages = ["/fallbacks/landscape.jpg"];

function normalize(s: string) {
  return s
    .normalize("NFD")
    // strip accents
    .replace(/\p{Diacritic}/gu, "")
    // keep letters/numbers as spaces, collapse later
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
  const name = searchParams.get("name");
  if (!name) return NextResponse.json({ urls: [] });

  const PEXELS_KEY = process.env.NEXT_PUBLIC_PEXELS_KEY;
  if (!PEXELS_KEY) {
    return NextResponse.json({ urls: defaultImages, error: "Missing API key" });
  }

  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(name)}&orientation=landscape&per_page=24`,
      { headers: { Authorization: PEXELS_KEY } }
    );
    if (!res.ok) throw new Error("Pexels API error");
    const data = await res.json();

    const photos: any[] = data.photos || [];
    const urlsStrict: string[] = [];
    const urlsFallback: string[] = [];
    const seenAuthors = new Set<string>();

    for (const p of photos) {
      const img = p?.src?.landscape || p?.src?.large2x || p?.src?.original;
      if (!img) continue;

      const author = (p.photographer || "").toLowerCase();
      if (seenAuthors.has(author)) continue;

      const text = `${p.alt || ""} ${p.url || ""} ${p.photographer || ""}`;

      if (containsPhrase(text, name)) {
        urlsStrict.push(img);
        seenAuthors.add(author);
        if (urlsStrict.length >= 4) break;
      } else {
        urlsFallback.push(img);
      }
    }

    const urls =
      urlsStrict.length >= 1
        ? urlsStrict.slice(0, 4)
        : Array.from(new Set(urlsFallback)).slice(0, 4);

    return NextResponse.json({
      urls: urls.length ? urls : defaultImages,
      meta: { country: name },
    });
  } catch {
    return NextResponse.json({ urls: defaultImages });
  }
}
