"use client";

import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen text-gray-300">
      <Loader2 className="animate-spin mr-2" /> Searching stays...
    </div>
  );
}
