"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

export default function HotelsSearch({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [countries, setCountries] = useState<string[]>([]);
  const [filteredCountries, setFilteredCountries] = useState<string[]>([]);
  const [country, setCountry] = useState("");
  const [cities, setCities] = useState<string[]>([]);
  const [filteredCities, setFilteredCities] = useState<string[]>([]);
  const [city, setCity] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [adults, setAdults] = useState(2);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);

  useEffect(() => {
    if (!open) {
      setCountry("");
      setCity("");
      setCheckIn("");
      setCheckOut("");
      setAdults(2);
      setFilteredCountries([]);
      setFilteredCities([]);
    }
  }, [open]);

  // Load countries
  useEffect(() => {
    fetch("/data/cities.json")
      .then((res) => res.json())
      .then((data) => setCountries(Object.keys(data)))
      .catch(() => setCountries([]));
  }, []);

  // Fetch cities when country changes
  useEffect(() => {
    if (!country) return;
    fetch(`/api/cities?country=${encodeURIComponent(country)}`)
      .then((res) => res.json())
      .then((data) => setCities(data.cities || []))
      .catch(() => setCities([]));
  }, [country]);

  const dateError = useMemo(() => {
    if (checkIn && checkOut && checkOut < checkIn)
      return "Check-out must be after check-in.";
    return "";
  }, [checkIn, checkOut]);

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="fixed z-[70] left-1/2 top-[92px] -translate-x-1/2 w-[min(92vw,600px)]
        rounded-2xl border border-white/15 bg-white/10 dark:bg-zinc-900/60
        backdrop-blur-2xl shadow-2xl p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Find Hotels</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition"
          >
            <X size={16} className="text-white" />
          </button>
        </div>

        <div className="space-y-3 relative">
          {/* Country Input */}
          <div className="relative">
            <input
              type="text"
              value={country}
              onChange={(e) => {
                const val = e.target.value;
                setCountry(val);
                setShowCountryDropdown(true);
                setFilteredCountries(
                  countries.filter((c) =>
                    c.toLowerCase().includes(val.toLowerCase())
                  )
                );
              }}
              onFocus={() => setShowCountryDropdown(true)}
              onBlur={() => setTimeout(() => setShowCountryDropdown(false), 150)}
              placeholder="Country"
              className="w-full rounded-xl bg-white/10 border border-white/15 text-white placeholder-white/60 py-3 px-4 focus:ring-2 focus:ring-pink-400 outline-none"
            />

            {showCountryDropdown && filteredCountries.length > 0 && (
              <ul className="absolute z-[80] mt-2 max-h-48 overflow-y-auto bg-black/70 backdrop-blur-md border border-white/10 rounded-xl shadow-lg text-white">
                {filteredCountries.map((c) => (
                  <li
                    key={c}
                    onClick={() => {
                      setCountry(c);
                      setShowCountryDropdown(false);
                    }}
                    className="px-4 py-2 hover:bg-pink-500/40 cursor-pointer transition"
                  >
                    {c}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* City Input */}
          <div className="relative">
            <input
              type="text"
              value={city}
              onChange={(e) => {
                const val = e.target.value;
                setCity(val);
                setShowCityDropdown(true);
                setFilteredCities(
                  cities.filter((ct) =>
                    ct.toLowerCase().includes(val.toLowerCase())
                  )
                );
              }}
              onFocus={() => setShowCityDropdown(true)}
              onBlur={() => setTimeout(() => setShowCityDropdown(false), 150)}
              placeholder="City"
              disabled={!country}
              className="w-full rounded-xl bg-white/10 border border-white/15 text-white placeholder-white/60 py-3 px-4 focus:ring-2 focus:ring-pink-400 outline-none disabled:opacity-40"
            />

            {showCityDropdown && filteredCities.length > 0 && (
              <ul className="absolute z-[90] mt-2 max-h-48 overflow-y-auto bg-black/70 backdrop-blur-md border border-white/10 rounded-xl shadow-lg text-white">
                {filteredCities.map((c, i) => (
                  <li
                    key={`${c}-${i}`}
                    onClick={() => {
                      setCity(c);
                      setShowCityDropdown(false);
                    }}
                    className="px-4 py-2 hover:bg-pink-500/40 cursor-pointer transition"
                  >
                    {c}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-white/70 mb-1">Check-in</label>
              <input
                type="date"
                value={checkIn}
                onChange={(e) => {
                  setCheckIn(e.target.value);
                  if (checkOut && e.target.value > checkOut) setCheckOut("");
                }}
                className="w-full bg-white/10 border border-white/15 rounded-xl text-white px-3 py-2 focus:ring-2 focus:ring-pink-400 outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] text-white/70 mb-1">Check-out</label>
              <input
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="w-full bg-white/10 border border-white/15 rounded-xl text-white px-3 py-2 focus:ring-2 focus:ring-pink-400 outline-none"
              />
            </div>
          </div>

          {/* Guests */}
          <div>
            <label className="block text-[11px] text-white/70 mb-1">Guests</label>
            <input
              type="number"
              min={1}
              value={adults}
              onChange={(e) => setAdults(parseInt(e.target.value || "1"))}
              className="w-full bg-white/10 border border-white/15 rounded-xl text-white px-3 py-2 focus:ring-2 focus:ring-pink-400 outline-none"
            />
          </div>

          {/* Submit */}
          <button
            disabled={!city || !checkIn || !checkOut || !!dateError}
            onClick={() => {
              const q = new URLSearchParams({
                country,
                city,
                checkIn,
                checkOut,
                adults: String(adults),
              });
              router.push(`/hotels/results?${q.toString()}`);
              onClose();
            }}
            className="w-full mt-4 bg-pink-600 hover:bg-pink-700 text-white font-semibold py-3 rounded-xl shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Search
          </button>

          {dateError && (
            <p className="text-[12px] text-amber-300 mt-1">{dateError}</p>
          )}
        </div>
      </div>
    </>
  );
}
