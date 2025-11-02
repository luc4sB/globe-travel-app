import Airports from "@/app/components/Airports";

export default function CountryAirportsPage({
  params,
}: {
  params: { country: string };
}) {
  const country = decodeURIComponent(params.country);
  return (
    <main className="min-h-screen bg-white dark:bg-zinc-950">
      <Airports country={country} />
    </main>
  );
}
