"use client";

import Image from "next/image";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { db } from "../../lib/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getCountFromServer,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";

type Trip = {
  id: string;
  userId: string;
  title: string;
  body: string;
  countryCode: string;
  cityName: string;
  imageUrl?: string;
  createdAt?: { seconds: number; nanoseconds: number };
  likeCount?: number;
  commentCount?: number;
  shareCount?: number;
};

type UserDoc = {
  displayName: string;
  photoURL?: string;
  bio?: string;
};

function formatDate(ts?: { seconds: number; nanoseconds: number }) {
  if (!ts) return "";
  const d = new Date(ts.seconds * 1000);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function UserProfilePage() {
  const params = useParams<{ uid: string }>();
  const uid = useMemo(() => (params?.uid ? String(params.uid) : ""), [params]);

  const search = useSearchParams();
  const focusPostId = search.get("post");

  const [profile, setProfile] = useState<UserDoc | null>(null);

  const [trips, setTrips] = useState<Trip[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [friendCount, setFriendCount] = useState<number>(0);

  const tripCount = trips.length;

  const totalLikes = useMemo(
    () =>
      trips.reduce(
        (sum, t) => sum + (typeof t.likeCount === "number" ? t.likeCount : 0),
        0
      ),
    [trips]
  );

  useEffect(() => {
    if (!uid) return;

    let cancelled = false;
    setLoadingProfile(true);

    (async () => {
      try {
        const uref = doc(db, "users", uid);
        const snap = await getDoc(uref);
        if (cancelled) return;

        if (!snap.exists()) {
          setProfile({ displayName: "Unknown user" });
          return;
        }

        const data = snap.data() as any;
        setProfile({
          displayName: data.displayName ?? "User",
          photoURL: data.photoURL,
          bio: data.bio,
        });
      } catch (e) {
        console.error(e);
        if (!cancelled) setProfile({ displayName: "User" });
      } finally {
        if (!cancelled) setLoadingProfile(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [uid]);

  useEffect(() => {
    if (!uid) return;

    let cancelled = false;
    setLoadingTrips(true);

    (async () => {
      try {
        const q = query(
          collection(db, "trips"),
          where("userId", "==", uid),
          orderBy("createdAt", "desc"),
          limit(50)
        );

        const snap = await getDocs(q);
        if (cancelled) return;

        const data: Trip[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }));

        setTrips(data);
      } catch (e) {
        console.error(e);
        if (!cancelled) setTrips([]);
      } finally {
        if (!cancelled) setLoadingTrips(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [uid]);

  useEffect(() => {
    if (!uid) return;

    let cancelled = false;

    (async () => {
      try {
        const col = collection(db, "friends", uid, "list");
        try {
          const agg = await getCountFromServer(col);
          if (!cancelled) setFriendCount(agg.data().count);
        } catch {
          const snap = await getDocs(col);
          if (!cancelled) setFriendCount(snap.size);
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) setFriendCount(0);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [uid]);

  useEffect(() => {
    if (!focusPostId || !trips.length) return;

    const el = document.getElementById(`post-${focusPostId}`);
    if (!el) return;

    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [focusPostId, trips]);

  const avatarUrl =
    profile?.photoURL && profile.photoURL.trim().length > 0
      ? profile.photoURL
      : "/logo.png";

  const displayName =
    profile?.displayName && profile.displayName.trim().length > 0
      ? profile.displayName
      : "User";

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto w-full max-w-5xl px-5 py-10">
        <div className="rounded-[2.25rem] border border-white/10 bg-white/5 shadow-[0_0_60px_rgba(0,0,0,0.45)] overflow-hidden">
          <div className="max-h-[calc(100vh-120px)] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="p-8">
              <div className="flex flex-col items-center text-center">
                <div className="relative h-24 w-24 overflow-hidden rounded-full border border-white/15 bg-white/10">
                  <Image
                    src={avatarUrl}
                    alt={displayName}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>

                <div className="mt-4">
                  {loadingProfile ? (
                    <div className="h-5 w-40 rounded bg-white/10 animate-pulse" />
                  ) : (
                    <h1 className="text-xl font-semibold tracking-tight">
                      {displayName}
                    </h1>
                  )}

                  <p className="mt-1 text-[12px] text-white/55">
                    @{uid.slice(0, 8)}
                  </p>

                  {!!profile?.bio && (
                    <p className="mt-3 max-w-md text-[13px] text-white/80 leading-relaxed">
                      {profile.bio}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-black/20 p-3">
                <div className="flex flex-col items-center justify-center py-2">
                  <div className="text-lg font-semibold leading-none">
                    {loadingTrips ? "—" : tripCount}
                  </div>
                  <div className="mt-1 text-[11px] uppercase tracking-wide text-white/55">
                    Trips
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center py-2 border-x border-white/10">
                  <div className="text-lg font-semibold leading-none">
                    {loadingTrips ? "—" : friendCount}
                  </div>
                  <div className="mt-1 text-[11px] uppercase tracking-wide text-white/55">
                    Friends
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center py-2">
                  <div className="text-lg font-semibold leading-none">
                    {loadingTrips ? "—" : totalLikes}
                  </div>
                  <div className="mt-1 text-[11px] uppercase tracking-wide text-white/55">
                    Likes
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-white/10" />

            <div className="p-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {loadingTrips && (
                <>
                  <div className="h-80 rounded-2xl bg-white/5 animate-pulse" />
                  <div className="h-80 rounded-2xl bg-white/5 animate-pulse" />
                  <div className="h-80 rounded-2xl bg-white/5 animate-pulse" />
                  <div className="h-80 rounded-2xl bg-white/5 animate-pulse" />
                  <div className="h-80 rounded-2xl bg-white/5 animate-pulse" />
                  <div className="h-80 rounded-2xl bg-white/5 animate-pulse" />
                </>
              )}

              {!loadingTrips && trips.length === 0 && (
                <div className="sm:col-span-2 lg:col-span-3 rounded-2xl border border-white/10 bg-black/20 p-6 text-center">
                  <div className="text-sm text-white/70">
                    No trips shared yet.
                  </div>
                </div>
              )}

              {!loadingTrips &&
                trips.map((trip) => (
                  <article
                    key={trip.id}
                    id={`post-${trip.id}`}
                    className={[
                      "rounded-2xl border border-white/10 bg-black/20 overflow-hidden",
                      "shadow-[0_10px_30px_rgba(0,0,0,0.35)]",
                      focusPostId === trip.id ? "ring-2 ring-sky-400/60" : "",
                    ].join(" ")}
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
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold line-clamp-1">
                              {trip.title}
                            </div>
                            <div className="text-[11px] text-white/75">
                              {trip.cityName}, {trip.countryCode}
                            </div>
                          </div>
                          <div className="text-[11px] text-white/65 whitespace-nowrap">
                            {formatDate(trip.createdAt)}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="p-4">
                      {!trip.imageUrl && (
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold line-clamp-2">
                              {trip.title}
                            </div>
                            <div className="text-[11px] text-white/70">
                              {trip.cityName}, {trip.countryCode}
                            </div>
                          </div>
                          <div className="text-[11px] text-white/60 whitespace-nowrap">
                            {formatDate(trip.createdAt)}
                          </div>
                        </div>
                      )}

                      <p className="text-[13px] text-white/85 leading-relaxed break-words line-clamp-4">
                        {trip.body}
                      </p>

                      <div className="mt-3 grid grid-cols-3 rounded-xl border border-white/10 bg-black/30 py-2 text-center">
                        <div className="text-[12px] text-white/75">
                          <span className="font-semibold text-white/90">
                            {trip.likeCount ?? 0}
                          </span>{" "}
                          likes
                        </div>
                        <div className="text-[12px] text-white/75 border-x border-white/10">
                          <span className="font-semibold text-white/90">
                            {trip.commentCount ?? 0}
                          </span>{" "}
                          comments
                        </div>
                        <div className="text-[12px] text-white/75">
                          <span className="font-semibold text-white/90">
                            {trip.shareCount ?? 0}
                          </span>{" "}
                          shares
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
