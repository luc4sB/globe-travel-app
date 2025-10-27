import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name");

  if (!name) return NextResponse.json({ urls: [] });

  const PEXELS_KEY = process.env.NEXT_PUBLIC_PEXELS_KEY;
  if (!PEXELS_KEY) {
    console.error("⚠️ Missing Pexels API key");
    return NextResponse.json({ urls: [] });
  }

  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(
        name + " landscape travel"
      )}&per_page=6&orientation=landscape`,
      {
        headers: {
          Authorization: PEXELS_KEY,
        },
      }
    );

    if (!res.ok) throw new Error(`Pexels API error: ${res.status}`);
    const data = await res.json();

    const urls = (data.photos || []).map((photo: any) => photo.src.large);
    return NextResponse.json({ urls });
  } catch (err) {
    console.error("❌ Failed to fetch Pexels images:", err);
    return NextResponse.json({ urls: [] });
  }
}
