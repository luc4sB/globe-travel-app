"use client";

import "./globals.css";
import { GeistSans, GeistMono } from "geist/font";
import { ThemeProvider, useTheme } from "./themeProvider";
import ThemeToggle from "./components/themeToggle";
import Background from "./components/Background";

/** Ensure the correct theme class is on <html> BEFORE hydration */
const themeInit = `
(function() {
  try {
    var saved = localStorage.getItem('theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = saved || (prefersDark ? 'dark' : 'light');
    var isDark = theme === 'dark';
    var html = document.documentElement;
    if (isDark) html.classList.add('dark'); else html.classList.remove('dark');
  } catch (e) {}
})();
`;

function Navbar() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <nav
      style={{
        backgroundColor: isDark
          ? "rgba(10,12,24,0.50)"
          : "rgba(255,255,255,0.65)",
        color: isDark ? "#e2e8f0" : "#1e3a8a",
        borderBottom: isDark
          ? "1px solid rgba(255,255,255,0.10)"
          : "1px solid rgba(0,0,0,0.08)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        transition:
          "background-color 250ms ease, color 250ms ease, border-color 250ms ease",
      }}
      className="fixed top-0 left-0 w-full z-50 shadow-sm flex justify-between items-center px-6 py-3"
    >
      {/* Left section: logo + name */}
      <div className="flex items-center gap-2 select-none">
        {/* Orbital static logo */}
        <div className="relative w-6 h-6">
          {/* Globe base */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: isDark
                ? "radial-gradient(circle at 30% 30%, #1e90ff, #001a33)"
                : "radial-gradient(circle at 30% 30%, #3fa9f5, #004080)",
              boxShadow: isDark
                ? "0 0 5px rgba(30,144,255,0.7)"
                : "0 0 5px rgba(63,169,245,0.6)",
            }}
          />

          {/* Static orbit line (smaller, more solid) */}
          <div
            className="absolute left-1/2 top-1/2"
            style={{
              width: "125%", // reduced from 160%
              height: "1.5px", // slightly thinner
              background: isDark
                ? "linear-gradient(90deg, transparent, rgba(255,255,255,1), transparent)"
                : "linear-gradient(90deg, transparent, rgba(255, 255, 255, 1), transparent)",
              transform: "translate(-50%, -50%) rotate(45deg)",
              opacity: 1, // stronger visibility
            }}
          />
        </div>

        <h1 className="text-xl font-semibold tracking-wide">Orbital</h1>
      </div>

      {/* Right section: theme toggle */}
      <ThemeToggle />
    </nav>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <Navbar />
          <Background />
          {/* Padding to prevent content from hiding behind navbar */}
          <main className="pt-16">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
