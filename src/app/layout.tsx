"use client";

import "./globals.css";
import { GeistSans, GeistMono } from "geist/font";
import { ThemeProvider, useTheme } from "./themeProvider";
import ThemeToggle from "./components/themeToggle";
import Background from "./components/Background";
import SearchBar from "./components/SearchBar";

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
      style={
        {
          "--nav-height": "70px",
          backgroundColor: isDark
            ? "rgba(10, 10, 20, 0.001)"
            : "rgba(255, 255, 255, 0.001)",
          borderColor: isDark
            ? "rgba(255,255,255,0.05)"
            : "rgba(255,255,255,0.25)",
          boxShadow: isDark
            ? "0 0 25px rgba(0,0,0,0.2)"
            : "0 0 20px rgba(0,0,0,0.05)",
        } as React.CSSProperties
      }
      className={`fixed top-0 left-0 w-full z-50 flex items-center justify-between
      px-8 py-3 h-[var(--nav-height)] backdrop-blur-[40px] border-b transition-all duration-300
      ${isDark ? "text-gray-100" : "text-slate-800"}`}
    >
      {/* Left: Logo */}
      <div className="flex items-center gap-2 select-none">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-white font-semibold text-sm"
          style={{
            background: isDark
              ? "linear-gradient(135deg, #2563eb 0%, #1e3a8a 100%)"
              : "linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)",
            boxShadow: isDark
              ? "0 0 10px rgba(59,130,246,0.4)"
              : "0 0 8px rgba(59,130,246,0.3)",
          }}
        >
          O
        </div>
        <h1 className="text-lg font-semibold tracking-tight">Orbital</h1>
      </div>

      {/* Center: Search */}
      <div className="flex-1 flex justify-center">
        <div className="w-full max-w-md">
          <SearchBar />
        </div>
      </div>

      {/* Right: Links + Theme */}
      <div className="flex items-center gap-4">
        <button className="hidden sm:inline text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-sky-400 transition-colors">
          Explore
        </button>
        <button className="hidden sm:inline text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-sky-400 transition-colors">
          Flights
        </button>
        <ThemeToggle />
      </div>
    </nav>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="!scroll-smooth" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased overflow-hidden`}
      >
        <ThemeProvider>
          <Navbar />
          <Background />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
