"use client";

import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";

type Props = {
  selected: string | null;
  onClose: () => void;
};

const imageCache = new Map<string, string[]>();

export default function CountryInfoPanel({ selected, onClose }: Props) {
  const [images, setImages] = useState<string[]>([]);
  const [mainImage, setMainImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selected) return;

    if (imageCache.has(selected)) {
      const cached = imageCache.get(selected)!;
      setImages(cached);
      setMainImage(cached[0]);
      return;
    }

    setLoading(true);
    fetch(`/api/countryImages?name=${encodeURIComponent(selected)}`)
      .then((r) => r.json())
      .then((d) => {
        const urls = d.urls ?? [];
        imageCache.set(selected, urls);
        setImages(urls);
        if (urls.length > 0) setMainImage(urls[0]);
      })
      .catch(() => {
        setImages([]);
        setMainImage(null);
      })
      .finally(() => setLoading(false));
  }, [selected]);

  return (
    <AnimatePresence>
      {selected && (
        <>
          {/* Mobile overlay */}
          <motion.div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm md:hidden z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Side panel */}
          <motion.div
            key="panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 90, damping: 14 }}
            className="fixed right-0 top-0 z-50 h-full w-full sm:w-[420px] bg-white dark:bg-zinc-900 border-l border-gray-300 dark:border-zinc-800 shadow-2xl overflow-y-auto"
          >
            <div className="relative h-full flex flex-col">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/80 dark:bg-zinc-800/60 hover:bg-white dark:hover:bg-zinc-800 transition z-10"
                aria-label="Close panel"
              >
                <X size={20} className="text-gray-700 dark:text-gray-200" />
              </button>

              {/* Hero section */}
              <div className="relative w-full h-48 sm:h-56 bg-zinc-200 dark:bg-zinc-800">
                {loading ? (
                  <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                    <Loader2 className="animate-spin mr-2" /> Loading...
                  </div>
                ) : mainImage ? (
                  <Image
                    key={mainImage} // triggers re-render for smooth fade
                    src={mainImage}
                    alt={`${selected} hero`}
                    fill
                    className="object-cover transition-opacity duration-300"
                    priority
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-sm text-gray-400 dark:text-gray-500">
                    No image available
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                <h2 className="absolute bottom-3 left-4 text-2xl font-semibold text-white drop-shadow-md">
                  {selected}
                </h2>
              </div>

              {/* Photo gallery */}
              {images.length > 1 && (
                <div className="p-4 flex gap-2 overflow-x-auto">
                  {images.map((src, i) => (
                    <button
                      key={i}
                      onClick={() => setMainImage(src)}
                      className="relative flex-shrink-0 w-40 h-28 focus:outline-none"
                    >
                      <Image
                        src={src}
                        alt={`${selected} view ${i + 1}`}
                        fill
                        className={`rounded-lg object-cover shadow-sm transition-all duration-200 ${
                          mainImage === src
                            ? "ring-4 ring-blue-500 scale-[1.02]"
                            : "hover:opacity-90"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Info and flight search */}
              <div className="flex flex-col gap-5 px-5 py-6 border-t border-gray-200 dark:border-zinc-800">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-1">
                    Explore {selected}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    Discover breathtaking landscapes, cultural landmarks, and travel
                    opportunities in {selected}. Choose your departure airport below to
                    explore available flights.
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                    Find flights to {selected}
                  </h4>
                  <input
                    type="text"
                    placeholder="Enter departure airport (IATA)"
                    className="p-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <button className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 font-medium transition">
                    Search Flights
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
