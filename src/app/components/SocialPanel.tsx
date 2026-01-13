"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { collection, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "./AuthProvider";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";


type Trip = {
  id: string;
  userId: string;
  title: string;
  body: string;
  countryCode: string;
  cityName: string;
  imageUrl?: string;
  imagePath?: string;
  createdAt?: { seconds: number; nanoseconds: number };
};

type SocialPanelProps = {
  open: boolean;
  selectedCountry: string | null;
  onClose: () => void;
  onCreateTrip?: () => void;
  className?: string;
  slideFrom?: "left" | "right";
  refreshKey?: number;
};

function formatDate(ts?: { seconds: number; nanoseconds: number }) {
  if (!ts) return "";
  const d = new Date(ts.seconds * 1000);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export default function SocialPanel({
  open,
  selectedCountry,
  onClose,
  onCreateTrip,
  className = "",
  slideFrom = "left",
  refreshKey = 0,
}: SocialPanelProps) {
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);

  const [stableCountry, setStableCountry] = useState<string | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const reqIdRef = useRef(0);

  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    if (!open || !selectedCountry) {
      setStableCountry(null);
      return;
    }

    debounceTimerRef.current = setTimeout(() => {
      setStableCountry(selectedCountry);
    }, 250);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [open, selectedCountry]);

  useEffect(() => {
    const reqId = ++reqIdRef.current;

    if (!open || !stableCountry) {
      setTrips([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    (async () => {
      try {
        const q = query(
          collection(db, "trips"),
          where("countryCode", "==", stableCountry),
          orderBy("createdAt", "desc"),
          limit(50)
        );

        const snap = await getDocs(q);
        if (reqId !== reqIdRef.current) return;

        const data: Trip[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }));

        setTrips(data);
      } catch (e) {
        if (reqId === reqIdRef.current) setTrips([]);
        // eslint-disable-next-line no-console
        console.error(e);
      } finally {
        if (reqId === reqIdRef.current) setLoading(false);
      }
    })();
  }, [open, stableCountry, refreshKey]);

  if (!selectedCountry) return null;

  const hasTrips = trips.length > 0;

return (
  <AnimatePresence>
    {open && selectedCountry && (
      <>
        {/* Mobile overlay */}
        <motion.div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm md:hidden z-40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        {/* Panel */}
        <motion.aside
          key={`${selectedCountry}-${refreshKey ?? 0}`}
          initial={{ x: "-100%" }}
          animate={{ x: 0 }}
          exit={{ x: "-100%" }}
          transition={{ type: "spring", stiffness: 90, damping: 14 }}
          className={[
            "fixed left-0 top-0 z-50 h-full w-full sm:w-[440px]",
            "backdrop-blur-3xl bg-gradient-to-b from-white/10 to-black/40",
            "dark:from-zinc-900/70 dark:to-black/60",
            "border-r border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.4)]",
            "overflow-hidden",
            className ?? "",
          ].join(" ")}
        >
          <div className="relative h-full flex flex-col">
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/20 dark:bg-zinc-800/60 hover:bg-white/30 transition z-10"
              aria-label="Close"
            >
              <X size={20} className="text-white" />
            </button>

            {/* Header title row */}
            <div className="pt-6 pb-3 px-6 border-b border-white/10">
              <h2 className="text-lg font-semibold text-white/90">Community</h2>
            </div>

            {/* Share bar */}
            <div className="px-6 pt-4 pb-4 border-b border-white/10">
              {user ? (
                <button
                  onClick={onCreateTrip}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-full bg-sky-500 hover:bg-sky-600 text-xs font-semibold text-white shadow-md shadow-sky-500/40 transition-colors"
                >
                  <span>Share a trip</span>
                </button>
              ) : (
                <p className="text-[11px] text-slate-300">
                  Log in to share your trips in{" "}
                  <span className="font-semibold text-sky-300">{selectedCountry}</span>.
                </p>
              )}
            </div>

            {/* Feed */}
            <div className="flex-1 px-6 py-5 space-y-4 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {loading && (
                <div className="space-y-3">
                  <div className="h-56 rounded-2xl bg-slate-800/60 animate-pulse" />
                  <div className="h-56 rounded-2xl bg-slate-800/60 animate-pulse" />
                </div>
              )}

              {!loading && !hasTrips && (
                <div className="text-[12px] text-slate-400 text-center pt-6 px-2">
                  No trips shared here yet.
                  <br />
                  Be the first to post about this destination.
                </div>
              )}

              {!loading &&
                hasTrips &&
                trips.map((trip) => (
                  <article
                    key={trip.id}
                    className="rounded-2xl border border-white/10 bg-black/20 hover:bg-black/25 transition overflow-hidden shadow-sm shadow-black/40"
                  >
                    {trip.imageUrl && (
                      <div className="relative w-full aspect-[16/9] bg-white/5">
                        <Image
                          src={trip.imageUrl}
                          alt={trip.title}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
                        <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between gap-3">
                          <div className="flex flex-col">
                            <h3 className="text-sm font-semibold text-white line-clamp-1 break-words">
                              {trip.title}
                            </h3>
                            <span className="text-[11px] text-slate-200/90">
                              {trip.cityName}, {trip.countryCode}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-200/80 whitespace-nowrap">
                            {formatDate(trip.createdAt)}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="px-4 py-3">
                      {!trip.imageUrl && (
                        <header className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex flex-col">
                            <h3 className="text-sm font-semibold text-white line-clamp-2 break-words">
                              {trip.title}
                            </h3>
                            <span className="text-[11px] text-slate-400">
                              {trip.cityName}, {trip.countryCode}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 whitespace-nowrap">
                            {formatDate(trip.createdAt)}
                          </span>
                        </header>
                      )}

                      <p className="text-[12px] text-slate-200 leading-relaxed line-clamp-5 break-words">
                        {trip.body}
                      </p>
                    </div>
                  </article>
                ))}
            </div>
          </div>
        </motion.aside>
      </>
    )}
  </AnimatePresence>
);

}
