"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";

type Airport = {
  name: string;
  city: string;
  country: string;
  iata_code: string;
};

export default function FlightSearchPanel({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [airports, setAirports] = useState<Airport[]>([]);
  const [tripType, setTripType] = useState<"oneway" | "return">("oneway");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [departDate, setDepartDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [filteredFrom, setFilteredFrom] = useState<Airport[]>([]);
  const [filteredTo, setFilteredTo] = useState<Airport[]>([]);
  const [showFrom, setShowFrom] = useState(false);
  const [showTo, setShowTo] = useState(false);

  useEffect(() => {
    fetch("/data/airports.json")
      .then((r) => r.json())
      .then((data) => setAirports(data || []))
      .catch(() => setAirports([]));
  }, []);

  const filterAirports = (val: string, setFiltered: any) => {
    if (!val.trim()) return setFiltered([]);
    const res = airports.filter(
      (a) =>
        a.name.toLowerCase().includes(val.toLowerCase()) ||
        a.city.toLowerCase().includes(val.toLowerCase()) ||
        a.iata_code.toLowerCase().includes(val.toLowerCase())
    );
    setFiltered(res.slice(0, 8));
  };

  const handleSearch = () => {
    const origin = airports.find(
      (a) =>
        a.iata_code.toLowerCase() === from.toLowerCase() ||
        `${a.city} (${a.iata_code})`.toLowerCase() === from.toLowerCase()
    );
    const destination = airports.find(
      (a) =>
        a.iata_code.toLowerCase() === to.toLowerCase() ||
        `${a.city} (${a.iata_code})`.toLowerCase() === to.toLowerCase()
    );

    if (!origin || !destination) {
      alert("Please select valid airports for both fields.");
      return;
    }
    if (!departDate) {
      alert("Please select a departure date.");
      return;
    }
    if (tripType === "return" && !returnDate) {
      alert("Please select a return date.");
      return;
    }

    const params = new URLSearchParams({
      origin: origin.iata_code,
      destination: destination.iata_code,
      departDate,
      tripType,
      ...(tripType === "return" && { returnDate }),
    });
    router.push(`/flights/results?${params}`);
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-md z-50 flex flex-col items-center justify-start pt-[90px]"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          transition={{ type: "spring", stiffness: 90, damping: 14 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-[90%] sm:w-[800px] rounded-3xl p-6 glass bg-white/10 dark:bg-zinc-900/70 border border-white/20 backdrop-blur-2xl shadow-2xl"
        >
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
          >
            <X size={20} />
          </button>

          <h2 className="text-2xl font-semibold text-white mb-4 text-center">
            Search Flights
          </h2>

          {/* Trip type */}
          <div className="flex justify-center gap-3 mb-4">
            <button
              onClick={() => setTripType("oneway")}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                tripType === "oneway"
                  ? "bg-sky-500 text-white"
                  : "border border-sky-400/50 text-sky-400 hover:bg-sky-500/10"
              }`}
            >
              One Way
            </button>
            <button
              onClick={() => setTripType("return")}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                tripType === "return"
                  ? "bg-sky-500 text-white"
                  : "border border-sky-400/50 text-sky-400 hover:bg-sky-500/10"
              }`}
            >
              Return
            </button>
          </div>

          {/* Input fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            {/* From */}
            <div className="relative">
              <label className="text-xs text-gray-300 mb-1 block">From</label>
              <input
                value={from}
                onChange={(e) => {
                  setFrom(e.target.value);
                  filterAirports(e.target.value, setFilteredFrom);
                }}
                onFocus={() => setShowFrom(true)}
                onBlur={() => setTimeout(() => setShowFrom(false), 200)}
                placeholder="City or Airport"
                className="w-full px-3 py-2 rounded-xl bg-white/10 border border-gray-400/30 text-gray-100 text-sm focus:ring-2 focus:ring-sky-400 outline-none"
              />
              {showFrom && filteredFrom.length > 0 && (
                <ul className="absolute left-0 right-0 mt-2 glass rounded-xl shadow-lg overflow-hidden z-50 max-h-56 overflow-y-auto backdrop-blur-lg scrollbar-hide">
                  {filteredFrom.map((a) => (
                    <li
                      key={a.iata_code}
                      onClick={() => {
                        setFrom(`${a.city} (${a.iata_code})`);
                        setShowFrom(false);
                      }}
                      className="px-4 py-2 cursor-pointer hover:bg-sky-100/70 dark:hover:bg-zinc-700/70 transition text-sm text-gray-800 dark:text-gray-100 flex justify-between"
                    >
                      <span>
                        {a.city} — {a.name}
                      </span>
                      <span className="text-xs text-sky-400 font-mono">{a.iata_code}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* To */}
            <div className="relative">
              <label className="text-xs text-gray-300 mb-1 block">To</label>
              <input
                value={to}
                onChange={(e) => {
                  setTo(e.target.value);
                  filterAirports(e.target.value, setFilteredTo);
                }}
                onFocus={() => setShowTo(true)}
                onBlur={() => setTimeout(() => setShowTo(false), 200)}
                placeholder="City or Airport"
                className="w-full px-3 py-2 rounded-xl bg-white/10 border border-gray-400/30 text-gray-100 text-sm focus:ring-2 focus:ring-sky-400 outline-none"
              />
              {showTo && filteredTo.length > 0 && (
                <ul className="absolute left-0 right-0 mt-2 glass rounded-xl shadow-lg overflow-hidden z-50 max-h-56 overflow-y-auto backdrop-blur-lg scrollbar-hide">
                  {filteredTo.map((a) => (
                    <li
                      key={a.iata_code}
                      onClick={() => {
                        setTo(`${a.city} (${a.iata_code})`);
                        setShowTo(false);
                      }}
                      className="px-4 py-2 cursor-pointer hover:bg-sky-100/70 dark:hover:bg-zinc-700/70 transition text-sm text-gray-800 dark:text-gray-100 flex justify-between"
                    >
                      <span>
                        {a.city} — {a.name}
                      </span>
                      <span className="text-xs text-sky-400 font-mono">{a.iata_code}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="text-xs text-gray-300 mb-1 block">Depart</label>
              <input
                type="date"
                value={departDate}
                onChange={(e) => setDepartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/10 border border-gray-500/30 text-gray-100 text-sm focus:ring-2 focus:ring-sky-400 outline-none"
              />
            </div>
            {tripType === "return" && (
              <div>
                <label className="text-xs text-gray-300 mb-1 block">Return</label>
                <input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/10 border border-gray-500/30 text-gray-100 text-sm focus:ring-2 focus:ring-sky-400 outline-none"
                />
              </div>
            )}
          </div>

          <button
            onClick={handleSearch}
            className="w-full bg-sky-500 hover:bg-sky-600 text-white rounded-xl py-3 font-semibold transition-all shadow-md hover:shadow-lg"
          >
            Search Flights
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
