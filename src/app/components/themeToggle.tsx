"use client";
import { useTheme } from "../themeProvider";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <button
  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
  className={`
    p-2.5 rounded-full shadow-md transition-all duration-300
    ${theme === "dark"
      ? "bg-gradient-to-br from-sky-500/40 to-indigo-600/40 hover:from-sky-500/60 hover:to-indigo-600/60"
      : "bg-gradient-to-br from-sky-100 to-sky-300 hover:from-sky-200 hover:to-sky-400"}
    backdrop-blur-md border border-white/30
  `}
  aria-label="Toggle theme"
  title="Toggle theme"
>
  {theme === "dark" ? "🌞" : "🌙"}
</button>

  );
}
