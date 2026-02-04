"use client";

import "./globals.css";
import { GeistSans, GeistMono } from "geist/font";
import { ThemeProvider, useTheme } from "./themeProvider";
import ThemeToggle from "./components/themeToggle";
import Background from "./components/Background";
import SearchBar from "./components/SearchBar";
import LogoIntro from "./components/LogoIntro";
import FlightSearchPanel from "./components/FlightSearchPanel";
import HotelsSearch from "./components/HotelsSearch";
import { useState, createContext, useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Globe, SlidersHorizontal, MoreVertical } from "lucide-react";
import { AuthProvider, useAuth } from "./components/AuthProvider";
import { signOut } from "firebase/auth";
import { auth } from "./lib/firebase";
import AuthModal from "./components/AuthModal";
import { Suspense } from "react";


// Share filter state between navbar and HotelResults
export const FilterContext = createContext<{
  showFilters: boolean;
  toggleFilters: () => void;
}>({ showFilters: false, toggleFilters: () => {} });

function Navbar({
  onFlightsClick,
  onHotelsClick,
  onToggleFilters,
  onLoginClick,
  onSignupClick,
}: {
  onFlightsClick: () => void;
  onHotelsClick: () => void;
  onToggleFilters: () => void;
  onLoginClick: () => void;
  onSignupClick: () => void;
}) {
  const { theme } = useTheme();
  const { user, loading } = useAuth();
  const isDark = theme === "dark";
  const pathname = usePathname();
  const router = useRouter();
  const sp = useSearchParams();

  const isHotelResults = pathname?.startsWith("/hotels/results");
  const city = sp.get("city") || "";
  const checkIn = sp.get("checkIn") || "";
  const checkOut = sp.get("checkOut") || "";

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!mobileMenuRef.current) return;
      if (!mobileMenuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };

    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/");
    } catch (err) {
      console.error("Error signing out", err);
    }
  };

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
      className={`fixed top-0 left-0 w-full z-50 relative flex flex-wrap items-center justify-between
        px-4 md:px-8 py-3 h-auto md:h-[var(--nav-height)]
        backdrop-blur-[40px] border-b transition-all duration-300
        ${isDark ? "text-gray-100" : "text-slate-800"}`}
    >
      {/* LEFT SECTION */}
      <div className="order-1 flex items-center gap-3 select-none">
        <div
          className="flex items-center cursor-pointer"
          onClick={() => router.push("/")}
        >
          <img
            src="/logo.png"
            alt="Orbital Logo"
            className="w-[2.6rem] h-[2.6rem] object-contain mr-[2px]"
          />
          <h1
            className="text-[1.25rem] font-semibold tracking-tight leading-none text-white"
            style={{ marginLeft: "-15%" }}
          >
            rbital
          </h1>
        </div>

        {isHotelResults && (
          <button
            onClick={() => router.push("/")}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
            title="Return to Globe"
          >
            <Globe size={18} />
          </button>
        )}
      </div>

      {/* CENTER SECTION */}
      <div
        className="
          order-3 w-full mt-2
          md:order-none md:mt-0
          md:absolute md:left-1/2 md:-translate-x-1/2
          md:w-[min(860px,36vw)]
        "
      >
        <div className="w-full px-1">
          {isHotelResults ? (
            <h2 className="text-center text-sm sm:text-base font-semibold text-white/90">
              🏨 Stays in <span className="text-pink-400">{city}</span>{" "}
              <span className="text-white/60 text-xs">
                ({checkIn} → {checkOut})
              </span>
            </h2>
          ) : (
            <div className="w-full [&_.fade-in]:!max-w-full">
              <SearchBar />
            </div>
          )}
        </div>
      </div>



      {/* RIGHT SECTION */}
      <div className="order-2 flex items-center gap-3">
        {isHotelResults ? (
          <button
            onClick={onToggleFilters}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-pink-500 hover:bg-pink-600 text-white text-sm font-medium shadow-md transition"
          >
            <SlidersHorizontal size={16} />
            <span className="hidden sm:inline">Filters</span>
          </button>
        ) : (
          <>
            {/* Desktop links */}
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event("open-ai-explore"))}
              className="hidden md:inline text-sm font-medium text-slate-300 hover:text-sky-400 transition-colors"
            >
              Explore
            </button>
            <button
              onClick={onFlightsClick}
              className="hidden md:inline text-sm font-medium text-slate-300 hover:text-sky-400 transition-colors"
            >
              Flights
            </button>
            <button
              onClick={onHotelsClick}
              className="hidden md:inline text-sm font-medium text-slate-300 hover:text-pink-400 transition-colors"
            >
              Hotels
            </button>
            {/* Mobile 3-dots */}
            <div className="relative md:hidden" ref={mobileMenuRef}>
              <button
                type="button"
                onClick={() => setMobileMenuOpen((p) => !p)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition text-white"
                aria-label="Open menu"
                title="Menu"
              >
                <MoreVertical size={18} />
              </button>

              {mobileMenuOpen && (
                <div className="absolute right-0 mt-2 w-44 rounded-2xl border border-white/10 bg-black/60 backdrop-blur-xl shadow-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      window.dispatchEvent(new Event("open-ai-explore"));
                    }}
                    className="w-full text-left px-4 py-3 text-sm text-white/90 hover:bg-white/10 transition"
                  >
                    Explore
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onFlightsClick();
                    }}
                    className="w-full text-left px-4 py-3 text-sm text-white/90 hover:bg-white/10 transition"
                  >
                    Flights
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onHotelsClick();
                    }}
                    className="w-full text-left px-4 py-3 text-sm text-white/90 hover:bg-white/10 transition"
                  >
                    Hotels
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* Auth controls */}
        {!loading && (
          <>
            {user ? (
              <button
                onClick={handleLogout}
                className="text-xs sm:text-sm font-medium px-3 py-1 rounded-full bg-sky-500 hover:bg-sky-600 text-white shadow-md shadow-sky-500/30 transition-colors"
              >
                Log out
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={onLoginClick}
                  className="text-xs sm:text-sm font-medium px-3 py-1 rounded-full bg-sky-500 hover:bg-sky-600 text-white shadow-md shadow-sky-500/30 transition-colors"
                >
                  Log in
                </button>
                <button
                  onClick={onSignupClick}
                  className="hidden sm:inline text-xs sm:text-sm font-medium px-3 py-1 rounded-full bg-pink-500 hover:bg-pink-600 text-white shadow-md shadow-pink-500/30 transition-colors"
                >
                  Sign up
                </button>
              </div>
            )}
          </>
        )}

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
  const [showFlights, setShowFlights] = useState(false);
  const [showHotels, setShowHotels] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");

  return (
    <html lang="en" className="!scroll-smooth" suppressHydrationWarning>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased overflow-hidden`}
      >
        <Suspense fallback={null}>
        <AuthProvider>
          <ThemeProvider>
            <Background />

            <FilterContext.Provider
              value={{
                showFilters,
                toggleFilters: () => setShowFilters((p) => !p),
              }}
            >
              <Navbar
                onFlightsClick={() => setShowFlights(true)}
                onHotelsClick={() => setShowHotels(true)}
                onToggleFilters={() => setShowFilters((p) => !p)}
                onLoginClick={() => {
                  setAuthMode("login");
                  setAuthModalOpen(true);
                }}
                onSignupClick={() => {
                  setAuthMode("signup");
                  setAuthModalOpen(true);
                }}
              />

              {children}
            </FilterContext.Provider>

            {/* Panels */}
            {showFlights && (
              <FlightSearchPanel onClose={() => setShowFlights(false)} />
            )}
            <HotelsSearch
              open={showHotels}
              onClose={() => setShowHotels(false)}
            />

            {/* Auth modal over globe */}
            <AuthModal
              open={authModalOpen}
              mode={authMode}
              onClose={() => setAuthModalOpen(false)}
              onSwitchMode={(m) => setAuthMode(m)}
            />

            <LogoIntro />
          </ThemeProvider>
        </AuthProvider>
        </Suspense>
      </body>
    </html>
  );
}
