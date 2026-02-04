"use client";

import { useSearchParams } from "next/navigation";

export default function NotFoundClient() {
  const sp = useSearchParams();
  const from = sp.get("from");

  return (
    <div className="text-center">
      <h1 className="text-3xl font-semibold">Page not found</h1>
      {from ? <p className="mt-2 text-white/60">From: {from}</p> : null}
    </div>
  );
}
