import { NextResponse } from "next/server";
import airportData from "../../../../public/data/airports.json";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const countryParam = searchParams.get("country");
  if (!countryParam) return NextResponse.json({ airports: [] });

  const normalize = (s: string) =>
    s.toLowerCase().replace(/[^a-z]/g, "").trim();

  const country = normalize(countryParam);

  const aliases: Record<string, string[]> = {
    unitedstatesofamerica: ["unitedstates", "usa", "us", "america"],
    unitedkingdom: ["uk", "england", "greatbritain", "britain"],
    southkorea: ["republicofkorea", "korea"],
    northkorea: ["democraticpeoplesrepublicofkorea"],
    uae: ["unitedarabemirates"],
  };

  const matchCountry = (target: string) => {
    const n = normalize(target);
    if (n === country) return true;
    for (const [main, alts] of Object.entries(aliases)) {
      if (main === country && alts.includes(n)) return true;
      if (alts.includes(country) && n === main) return true;
    }
    return false;
  };

  const airports = airportData.filter((a: any) => matchCountry(a.country));

  return NextResponse.json({ airports });
}
