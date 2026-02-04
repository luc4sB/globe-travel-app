import { Suspense } from "react";
import NotFoundClient from "./components/NotFoundClient";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 text-white">
      <Suspense fallback={<div className="text-white/60">Loading…</div>}>
        <NotFoundClient />
      </Suspense>
    </div>
  );
}
