"use client";

import { useEffect, useState } from "react";
import { getCountriesGeoJSON } from "../lib/countriesGeo";

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
const blacklist = new Set([
  // Europe / microstates / dependencies
  "Isle of Man", "Guernsey", "Jersey", "Gibraltar", "Svalbard", "Åland",
  "Liechtenstein", "San Marino", "Andorra", "Monaco", "Vatican",
  "Kosovo", "Northern Cyprus", "Faroe Islands", "Azores", "Madeira",
  "Canary Islands", "Jan Mayen", "Saint Pierre and Miquelon", "Greenland",

  // Disputed / unrecognized / non-sovereign
  "Western Sahara", "Somaliland", "Palestine", "Taiwan", "Bir Tawil",
  "Spratly Islands", "Paracel Islands", "Scarborough Shoal",
  "Aksai Chin", "Arunachal Pradesh", "Kashmir", "Ashmore and Cartier Islands",
  "Coral Sea Islands", "Heard Island and McDonald Islands",
  "South Georgia and the South Sandwich Islands", "Bouvet Island",
  "Tristan da Cunha", "British Indian Ocean Territory", "Diego Garcia",

  // Asia / special admin regions
  "Hong Kong", "Macau",

  // Americas / Caribbean territories
  "Bermuda", "Puerto Rico", "Falkland Islands", "French Guiana",
  "Reunion", "Mayotte", "Guadeloupe", "Martinique", "Cayman Islands",
  "Aruba", "Curaçao", "Guam", "American Samoa", "Northern Mariana Islands",
  "New Caledonia", "French Polynesia", "Wallis and Futuna", "Pitcairn Islands",
  "Saint Helena", "Saint Kitts and Nevis", "Antigua and Barbuda", "Dominica",
  "Saint Lucia", "Grenada", "Barbados", "Comoros", "Seychelles", "Mauritius",
  "Maldives", "Micronesia", "Palau", "Nauru", "Tuvalu", "Kiribati",
  "Marshall Islands", "Vanuatu", "Samoa", "Tonga", "Niue", "Cook Islands",
  "Tokelau", "Cape Verde", "Anguilla", "British Virgin Islands",
  "U.S. Virgin Islands", "Saint Barthélemy", "Saint Martin", "Sint Maarten",
  "Turks and Caicos Islands", "Montserrat", "Bonaire", "Norfolk Island",
  "Christmas Island", "Cocos (Keeling) Islands", "Easter Island"
]);

  useEffect(() => setIsClient(true), []);


useEffect(() => {
  getCountriesGeoJSON()
    .then((data) => {
      const countries: Country[] = (data.features ?? [])
        .filter((f: any) => {
          const name = f.properties?.name;
          return (
            name &&
            f.properties?.label_y &&
            f.properties?.label_x &&
            !blacklist.has(name)
          );
        })
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
<div className="relative w-full max-w-md fade-in">
  <div className="glass flex items-center px-4 py-2 rounded-2xl shadow-md focus-within:ring-2 focus-within:ring-sky-400 transition-all">
    <input
      type="text"
      placeholder="Search a country..."
      value={query}
      onChange={(e) => handleChange(e.target.value)}
      className="w-full bg-transparent text-gray-800 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none text-sm"
    />
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="w-5 h-5 text-gray-500 dark:text-gray-300"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0a7.5 7.5 0 10-10.606-10.606A7.5 7.5 0 0016.65 16.65z" />
    </svg>
  </div>

  {suggestions.length > 0 && (
    <ul className="absolute left-0 right-0 mt-2 glass rounded-xl shadow-lg overflow-hidden z-50">
      {suggestions.map((s) => (
        <li
          key={s.name}
          onClick={() => handleSelect(s)}
          className="px-4 py-2 cursor-pointer hover:bg-sky-100/70 dark:hover:bg-zinc-700/70 transition text-sm text-gray-800 dark:text-gray-100"
        >
          {s.name}
        </li>
      ))}
    </ul>
  )}
</div>

  );
}
