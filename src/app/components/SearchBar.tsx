"use client";

import { useEffect, useState } from "react";

type Country = {
  name: string;
  lat: number;
  lon: number;
};

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Country[]>([]);
  const [allCountries, setAllCountries] = useState<Country[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => setIsClient(true), []);


  useEffect(() => {
    const url = `${window.location.origin}/data/countries.geojson`;
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        const countries: Country[] = (data.features ?? [])
          .filter((f: any) => f.properties?.name && f.properties?.label_y && f.properties?.label_x)
          .map((f: any) => ({
            name: f.properties.name,
            lat: f.properties.label_y,
            lon: f.properties.label_x,
          }));
        setAllCountries(countries);
      })
      .catch((err) => console.error("Failed to load countries.geojson", err));
  }, []);

  if (!isClient) return null;

  const handleChange = (value: string) => {
    setQuery(value);
    if (value.trim().length < 1) {
      setSuggestions([]);
      return;
    }
    const filtered = allCountries.filter((c) =>
      c.name.toLowerCase().includes(value.toLowerCase())
    );
    setSuggestions(filtered.slice(0, 8));
  };

  const handleSelect = (country: Country) => {
    setQuery(country.name);
    setSuggestions([]);

    window.dispatchEvent(
      new CustomEvent("focus-country", {
        detail: {
          name: country.name,
          lat: country.lat,
          lon: country.lon,
        },
      })
    );
  };

  return (
    <div className="relative w-full max-w-md">
      <input
        type="text"
        placeholder="Search a country..."
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg text-sm bg-white/70 dark:bg-zinc-800/70 border border-gray-300 dark:border-zinc-700 focus:ring-2 focus:ring-blue-500 outline-none transition backdrop-blur-sm"
      />
      {suggestions.length > 0 && (
        <ul className="absolute left-0 right-0 mt-1 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded-lg shadow-md max-h-48 overflow-y-auto z-50">
          {suggestions.map((s) => (
            <li
              key={s.name}
              onClick={() => handleSelect(s)}
              className="px-3 py-2 cursor-pointer hover:bg-blue-100 dark:hover:bg-zinc-800 text-sm"
            >
              {s.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
