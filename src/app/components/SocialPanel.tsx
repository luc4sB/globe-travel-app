"use client";

import { useEffect, useRef, useState } from "react";
import { collection, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "./AuthProvider";

type Trip = {
  id: string;
  userId: string;
  title: string;
  body: string;
  countryCode: string;
  cityName: string;
  createdAt?: { seconds: number; nanoseconds: number };
};

type SocialPanelProps = {
  open: boolean;
  selectedCountry: string | null;
  onClose: () => void;
  onCreateTrip?: () => void;
  className?: string;
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
  }, [open, stableCountry]);

  if (!selectedCountry) return null;

  const hasTrips = trips.length > 0;

  return (
    <div
      className={`
        fixed z-40
        transition-all duration-300 ease-out
        pointer-events-auto
        ${open ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-full pointer-events-none"}
        ${className}
      `}
    >
      <div className="flex-1 rounded-3xl bg-slate-900/95 border border-white/10 shadow-2xl shadow-black/60 overflow-hidden flex flex-col">
        <div className="px-4 py-3 bg-gradient-to-r from-slate-900 via-slate-900 to-sky-900/60 border-b border-white/10 flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs uppercase tracking-[0.2em] text-slate-400">COMMUNITY</span>
            <h2 className="text-sm font-semibold text-white">Trips in {selectedCountry}</h2>
          </div>

          <button
            onClick={onClose}
            className="text-[11px] px-3 py-1 rounded-full bg-white/5 hover:bg-white/15 text-slate-200 transition-colors"
          >
            Close
          </button>
        </div>

        <div className="flex-1 flex flex-col bg-gradient-to-b from-slate-900/80 to-slate-950">
          <div className="px-4 pt-3 pb-2 border-b border-white/5">
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

          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
            {loading && (
              <div className="space-y-2">
                <div className="h-16 rounded-2xl bg-slate-800/60 animate-pulse" />
                <div className="h-16 rounded-2xl bg-slate-800/60 animate-pulse" />
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
                  className="rounded-2xl border border-white/10 bg-slate-900/80 px-3 py-2.5 shadow-sm shadow-black/40"
                >
                  <header className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex flex-col">
                      <h3 className="text-xs font-semibold text-white line-clamp-2">{trip.title}</h3>
                      <span className="text-[10px] text-slate-400">
                        {trip.cityName}, {trip.countryCode}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 whitespace-nowrap">
                      {formatDate(trip.createdAt)}
                    </span>
                  </header>
                  <p className="text-[11px] text-slate-200 line-clamp-4">{trip.body}</p>
                </article>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
