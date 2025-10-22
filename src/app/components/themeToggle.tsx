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
      className="
        p-2 rounded-full
        bg-gray-200 dark:bg-gray-700
        text-gray-800 dark:text-gray-100
        shadow hover:scale-110
        transition-transform duration-200
      "
      aria-label="Toggle theme"
      title="Toggle theme"
    >
      {theme === "dark" ? "🌞" : "🌙"}
    </button>
  );
}
