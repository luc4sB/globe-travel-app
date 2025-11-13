import Airports from "@/app/components/Airports";

export default async function CountryAirportsPage({
  params,
}: {
  params: Promise<{ country: string }>;
}) {
  const { country } = await params;
  const decodedCountry = decodeURIComponent(country);
  return (
    <main className="min-h-screen bg-white dark:bg-zinc-950">
      <Airports country={decodedCountry} />
    </main>
  );
}
