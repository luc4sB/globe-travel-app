import { NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";

export async function GET(req: Request) {
  try {
    const filePath = path.join(process.cwd(), "public", "data", "cities.json");
    const fileContents = await fs.readFile(filePath, "utf8");
    const allCities = JSON.parse(fileContents);

    const { searchParams } = new URL(req.url);
    const country = searchParams.get("country");

    // No country? → return all available countries
    if (!country) {
      return NextResponse.json({
        countries: Object.keys(allCities),
      });
    }

    // Specific country → return only its cities (or empty array if not found)
    const cities = allCities[country] || [];

    return NextResponse.json({
      country,
      cities,
    });
  } catch (err) {
    console.error("Error loading cities.json:", err);
    return NextResponse.json(
      { error: "Could not load city data." },
      { status: 500 }
    );
  }
}
