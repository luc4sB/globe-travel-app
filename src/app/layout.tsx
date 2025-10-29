"use client";

import "./globals.css";
import { GeistSans, GeistMono } from "geist/font";
import { ThemeProvider, useTheme } from "./themeProvider";
import ThemeToggle from "./components/themeToggle";
import Background from "./components/Background";
import SearchBar from "./components/SearchBar";

/** Theme initialization script (runs before hydration) */
const themeInit = `
(function() {
  try {
    var saved = localStorage.getItem('theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = saved || (prefersDark ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', theme === 'dark');
  } catch (e) {}
})();
`;

function Navbar() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 flex items-center justify-between px-6 py-3 transition-all backdrop-blur-md border-b ${
        isDark
          ? "bg-[#0b0e1a]/70 border-white/10 text-gray-100"
          : "bg-white/70 border-black/10 text-slate-800"
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 select-none">
        <div
          className="w-7 h-7 rounded-full relative overflow-hidden"
          style={{
            background: isDark
              ? "radial-gradient(circle at 30% 30%, #2f80ed, #0b0e1a)"
              : "radial-gradient(circle at 30% 30%, #60a5fa, #1e3a8a)",
            boxShadow: isDark
              ? "0 0 8px rgba(96,165,250,0.5)"
              : "0 0 6px rgba(96,165,250,0.6)",
          }}
        >
          <div
            className="absolute left-1/2 top-1/2 w-[130%] h-[2px]"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent)",
              transform: "translate(-50%, -50%) rotate(35deg)",
            }}
          />
        </div>
        <h1 className="text-xl font-semibold tracking-wide">Orbital</h1>
      </div>

      {/* Center: Country Search Bar */}
      <div className="hidden md:flex flex-1 justify-center max-w-md">
        <SearchBar />
      </div>

      {/* Right: Theme toggle */}
      <div className="flex items-center gap-3">
        <ThemeToggle />
      </div>
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
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased overflow-x-hidden`}
      >
        <ThemeProvider>
          <Navbar />
          <Background />
          {/* Main content with top padding to clear navbar */}
          <main className="pt-20">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
