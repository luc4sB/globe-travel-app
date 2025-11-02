"use client";

import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

type Airport = {
  name: string;
  city: string;
  country: string;
  iata_code: string;
};

type Props = {
  selected: string | null;
  onClose: () => void;
  preloadedImages?: string[];
};

const imageCache = new Map<string, string[]>();
const defaultImages = ["/fallbacks/landscape.jpg", "/fallbacks/mountain.jpg"];

export default function CountryInfoPanel({ selected, onClose, preloadedImages }: Props) {
  const [images, setImages] = useState<string[]>(preloadedImages ?? defaultImages);
  const [mainImage, setMainImage] = useState<string | null>(preloadedImages?.[0] ?? defaultImages[0]);
  const [loading, setLoading] = useState(false);

  const [airports, setAirports] = useState<Airport[]>([]);
  const [filteredOptions, setFilteredOptions] = useState<Airport[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const [tripType, setTripType] = useState<"oneway" | "return">("oneway");
  const [departAirport, setDepartAirport] = useState("");
  const [departDate, setDepartDate] = useState("");
  const [returnDate, setReturnDate] = useState("");

  const router = useRouter();

  // Load airports from local JSON
  useEffect(() => {
    fetch("/data/airports.json")
      .then((res) => res.json())
      .then((data) => setAirports(Array.isArray(data) ? data : data.airports ?? []))
      .catch(() => setAirports([]));
  }, []);

  // Load and cache images for selected country
  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    setImages(defaultImages);
    setMainImage(defaultImages[0]);

    if (preloadedImages?.length) {
      setImages(preloadedImages);
      setMainImage(preloadedImages[0]);
      setLoading(false);
      return;
    }

    if (imageCache.has(selected)) {
      const cached = imageCache.get(selected)!;
      setImages(cached);
      setMainImage(cached[0]);
      setLoading(false);
      return;
    }

    fetch(`/api/countryImages?name=${encodeURIComponent(selected)}`)
      .then((r) => r.json())
      .then((d) => {
        const urls = d.urls?.length ? d.urls : defaultImages;
        imageCache.set(selected, urls);
        setImages(urls);
        setMainImage(urls[0]);
      })
      .catch(() => {
        setImages(defaultImages);
        setMainImage(defaultImages[0]);
      })
      .finally(() => setLoading(false));
  }, [selected]);

  // Filter airports by user input
  const handleAirportSearch = (value: string) => {
    setDepartAirport(value);
    if (!value.trim()) {
      setFilteredOptions([]);
      return;
    }
    const filtered = airports.filter(
      (a) =>
        a.name.toLowerCase().includes(value.toLowerCase()) ||
        a.city.toLowerCase().includes(value.toLowerCase()) ||
        a.iata_code.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredOptions(filtered.slice(0, 8));
  };

  const handleDateChange = (type: "depart" | "return", value: string) => {
    if (type === "depart") {
      setDepartDate(value);
      if (returnDate && value > returnDate) setReturnDate("");
    } else {
      if (!departDate || value >= departDate) setReturnDate(value);
    }
  };

  const handleContinue = () => {
    const selectedAirport = airports.find(
      (a) =>
        a.iata_code.toLowerCase() === departAirport.toLowerCase() ||
        `${a.city} (${a.iata_code})`.toLowerCase() === departAirport.toLowerCase() ||
        a.name.toLowerCase() === departAirport.toLowerCase()
    );

    if (!selectedAirport) {
      alert("Please select a valid departure airport from the list.");
      return;
    }

    if (!departDate) {
      alert("Please select a departure date.");
      return;
    }

    if (tripType === "return" && !returnDate) {
      alert("Please select a valid return date.");
      return;
    }

    const params = new URLSearchParams({
      tripType,
      depart: selectedAirport.iata_code,
      departDate,
      ...(tripType === "return" && { returnDate }),
    });

    router.push(`/airports/${encodeURIComponent(selected!)}?${params}`);
  };

  return (
    <AnimatePresence>
      {selected && (
        <>
          {/* Overlay for mobile */}
          <motion.div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm md:hidden z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Glass Panel */}
          <motion.div
            key={selected}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 90, damping: 14 }}
            className="fixed right-0 top-0 z-50 h-full w-full sm:w-[440px]
                       backdrop-blur-3xl bg-gradient-to-b from-white/10 to-black/40
                       dark:from-zinc-900/70 dark:to-black/60 border-l border-white/10
                       shadow-[0_0_40px_rgba(0,0,0,0.4)] overflow-y-auto"
          >
            <div className="relative h-full flex flex-col">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/20 dark:bg-zinc-800/60 hover:bg-white/30 transition z-10"
              >
                <X size={20} className="text-white" />
              </button>

              {/* Hero image */}
              <div className="relative w-full h-64 bg-zinc-200 dark:bg-zinc-800">
                {loading ? (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <Loader2 className="animate-spin mr-2" /> Loading...
                  </div>
                ) : (
                  mainImage && (
                    <Image
                      key={mainImage}
                      src={mainImage}
                      alt={`${selected} hero`}
                      fill
                      priority
                      className="object-cover transition-opacity duration-300"
                    />
                  )
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <h2 className="absolute bottom-3 left-4 text-2xl font-semibold text-white drop-shadow-md">
                  {selected}
                </h2>
              </div>

              {/* Thumbnail gallery */}
              {images.length > 1 && (
                <div className="p-4 flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide">
                  {images.map((src, i) => (
                    <button
                      key={i}
                      onClick={() => setMainImage(src)}
                      className="relative flex-shrink-0 w-[220px] aspect-[16/9] rounded-xl overflow-hidden snap-start"
                    >
                      <Image
                        src={src}
                        alt={`${selected} view ${i + 1}`}
                        fill
                        loading="lazy"
                        className={`object-cover shadow-sm transition-all duration-200 ${
                          mainImage === src
                            ? "ring-4 ring-sky-500 scale-[1.02]"
                            : "hover:opacity-90"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Trip Planner */}
              <div className="p-6 space-y-5">
                {/* Trip Type */}
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => setTripType("oneway")}
                    className={`px-5 py-1.5 rounded-full text-sm font-medium transition ${
                      tripType === "oneway"
                        ? "bg-sky-500 text-white shadow-md"
                        : "bg-transparent border border-sky-400/50 text-sky-400 hover:bg-sky-500/10"
                    }`}
                  >
                    One Way
                  </button>
                  <button
                    onClick={() => setTripType("return")}
                    className={`px-5 py-1.5 rounded-full text-sm font-medium transition ${
                      tripType === "return"
                        ? "bg-sky-500 text-white shadow-md"
                        : "bg-transparent border border-sky-400/50 text-sky-400 hover:bg-sky-500/10"
                    }`}
                  >
                    Return
                  </button>
                </div>

                {/* Airport Search */}
                <div className="relative">
                  <label className="text-xs text-gray-300 mb-1 block">Departure Airport</label>
                  <div className="glass flex items-center px-4 py-2 rounded-2xl shadow-md focus-within:ring-2 focus-within:ring-sky-400 transition-all">
                    <input
                      type="text"
                      placeholder="Search airport or code..."
                      value={departAirport}
                      onChange={(e) => handleAirportSearch(e.target.value)}
                      onFocus={() => setShowDropdown(true)}
                      onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                      className="w-full bg-transparent text-gray-100 placeholder-gray-400 focus:outline-none text-sm"
                    />
                  </div>

                  {showDropdown && filteredOptions.length > 0 && (
                    <ul className="absolute left-0 right-0 mt-2 glass rounded-xl shadow-lg overflow-hidden z-[9999] max-h-56 overflow-y-auto backdrop-blur-lg scrollbar-hide">
                      {filteredOptions.map((a) => (
                        <li
                          key={a.iata_code}
                          onClick={() => {
                            setDepartAirport(`${a.city} (${a.iata_code})`);
                            setShowDropdown(false);
                          }}
                          className="px-4 py-2 cursor-pointer hover:bg-sky-100/70 dark:hover:bg-zinc-700/70 transition text-sm text-gray-800 dark:text-gray-100 flex justify-between"
                        >
                          <span>{a.city} — {a.name}</span>
                          <span className="text-xs text-sky-400 font-mono">{a.iata_code}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-300 mb-1 block">Departure Date</label>
                    <input
                      type="date"
                      value={departDate}
                      onChange={(e) => handleDateChange("depart", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white/10 dark:bg-zinc-900/40 border border-gray-500/30 text-gray-100 text-sm focus:ring-2 focus:ring-sky-400 outline-none"
                    />
                  </div>

                  {tripType === "return" && (
                    <div>
                      <label className="text-xs text-gray-300 mb-1 block">Return Date</label>
                      <input
                        type="date"
                        value={returnDate}
                        onChange={(e) => handleDateChange("return", e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-white/10 dark:bg-zinc-900/40 border border-gray-500/30 text-gray-100 text-sm focus:ring-2 focus:ring-sky-400 outline-none"
                      />
                    </div>
                  )}
                </div>

                {/* Continue button */}
                <button
                  onClick={handleContinue}
                  className="w-full bg-sky-500 hover:bg-sky-600 text-white rounded-xl py-3 font-semibold transition-all shadow-md hover:shadow-lg mt-2"
                >
                  View Airports in {selected}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
