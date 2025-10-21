"use client";

interface FlightResultsProps {
  flights: any[];
}

export default function FlightResults({ flights }: FlightResultsProps) {
  if (!flights || flights.length === 0)
    return <p className="my-4">No flights yet.</p>;

  return (
    <div className="flex flex-col gap-2 my-4 w-full max-w-md">
      {flights.map((f, idx) => (
        <div key={idx} className="border p-2 rounded">
          <p>
            <strong>From:</strong>{" "}
            {f.itineraries[0].segments[0].departure.iataCode}
          </p>
          <p>
            <strong>To:</strong> {f.itineraries[0].segments[0].arrival.iataCode}
          </p>
          <p>
            <strong>Price:</strong> {f.price.total} {f.price.currency}
          </p>
        </div>
      ))}
    </div>
  );
}
