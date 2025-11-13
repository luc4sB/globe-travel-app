"use client";

import { useState, useEffect } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

type AuthMode = "login" | "signup";

type Props = {
  open: boolean;
  mode: AuthMode;
  onClose: () => void;
  onSwitchMode: (mode: AuthMode) => void;
};

type FieldErrors = {
  email?: string;
  password?: string;
  displayName?: string;
  general?: string;
};

export default function AuthModal({
  open,
  mode,
  onClose,
  onSwitchMode,
}: Props) {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);

  const isLogin = mode === "login";

  // Reset form when modal opens / mode changes
  useEffect(() => {
    if (!open) return;
    setEmail("");
    setDisplayName("");
    setPassword("");
    setErrors({});
  }, [open, mode]);

  if (!open) return null;

  /** ------- Input sanitisation + validation -------- */

  const sanitizeEmail = (value: string) => value.trim().toLowerCase();

  const sanitizeDisplayName = (value: string) =>
    value.trim().replace(/\s+/g, " "); // collapse multiple spaces

  const sanitizePassword = (value: string) => value.trim();

  const validate = (): { ok: boolean; email: string; displayName: string; password: string } => {
    const newErrors: FieldErrors = {};

    const emailClean = sanitizeEmail(email);
    const pwdClean = sanitizePassword(password);
    const nameClean = sanitizeDisplayName(displayName);

    // Simple email check
    if (!emailClean) {
      newErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailClean)) {
      newErrors.email = "Please enter a valid email.";
    }

    // Password rules
    if (!pwdClean) {
      newErrors.password = "Password is required.";
    } else if (pwdClean.length < 8) {
      newErrors.password = "Password must be at least 8 characters.";
    } else if (/\s/.test(pwdClean)) {
      newErrors.password = "Password cannot contain spaces.";
    }

    // Display name rules (signup only)
    if (!isLogin) {
      if (!nameClean) {
        newErrors.displayName = "Display name is required.";
      } else if (nameClean.length < 3) {
        newErrors.displayName = "Display name must be at least 3 characters.";
      } else if (!/^[\p{L}\p{N} _.\-]+$/u.test(nameClean)) {
        newErrors.displayName =
          "Use only letters, numbers, spaces, dots, dashes and underscores.";
      }
    }

    setErrors(newErrors);

    const ok = Object.keys(newErrors).length === 0;
    return { ok, email: emailClean, password: pwdClean, displayName: nameClean };
  };

  /** ------- Submit handler -------- */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors((prev) => ({ ...prev, general: undefined }));

    const { ok, email: emailClean, password: pwdClean, displayName: nameClean } = validate();
    if (!ok) return;

    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, emailClean, pwdClean);
      } else {
        const cred = await createUserWithEmailAndPassword(auth, emailClean, pwdClean);

        if (nameClean) {
          await updateProfile(cred.user, { displayName: nameClean });
        }

        await setDoc(doc(db, "users", cred.user.uid), {
          displayName: nameClean,
          email: emailClean,
          createdAt: serverTimestamp(),
        });
      }

      onClose();
    } catch (err: any) {
      console.error(err);
      const msg = String(err?.message ?? "Something went wrong. Please try again.");
      setErrors((prev) => ({ ...prev, general: msg }));
    } finally {
      setLoading(false);
    }
  };

  /** ------- UI -------- */

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      {/* Glassy overlay over globe */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Floating island */}
      <div className="relative z-10 w-full max-w-md rounded-3xl bg-slate-900/95 border border-white/10 shadow-2xl shadow-black/70 overflow-hidden">
        {/* Top bar */}
        <div className="px-6 pt-4 pb-3 bg-gradient-to-r from-slate-900 via-slate-900 to-sky-900/60 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img
                src="/logo.png"
                alt="Orbital"
                className="w-8 h-8 object-contain"
              />
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-semibold text-white">
                  {isLogin ? "Welcome back" : "Join Orbital"}
                </span>
                <span className="text-xs text-slate-300">
                  {isLogin
                    ? "Log in to save trips & share journeys."
                    : "Create an account to plan & share trips."}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-xs text-slate-300 hover:text-white px-3 py-1 rounded-full bg-white/5 hover:bg-white/15 transition-colors"
            >
              Close
            </button>
          </div>

          {/* Mode toggle pills */}
          <div className="mt-4 flex justify-center">
            <div className="flex gap-2 bg-slate-900/60 rounded-full p-1 border border-white/10">
            {/* Login button */}
            <button
                type="button"
                onClick={() => onSwitchMode("login")}
                className={`px-4 py-1.5 text-xs font-medium rounded-full transition-colors ${
                isLogin
                    ? "bg-sky-500 text-white shadow-sm shadow-sky-500/50"
                    : "text-slate-300 hover:text-white"
                }`}
            >
                Log in
            </button>

            {/* Signup button */}
            <button
                type="button"
                onClick={() => onSwitchMode("signup")}
                className={`px-4 py-1.5 text-xs font-medium rounded-full transition-colors ${
                !isLogin
                    ? "bg-pink-500 text-white shadow-sm shadow-pink-500/50"
                    : "text-slate-300 hover:text-white"
                }`}
            >
                Sign up
            </button>
            </div>
        </div>
        </div>

        {/* Form body */}
        <form
          onSubmit={handleSubmit}
          className="px-6 py-5 space-y-4 bg-gradient-to-b from-slate-900/80 to-slate-950"
        >
          {!isLogin && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">
                Display name
              </label>
              <input
                type="text"
                autoComplete="nickname"
                className={`w-full rounded-xl bg-slate-900/70 border px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 ${
                  errors.displayName
                    ? "border-red-500/60 focus:ring-red-500/70"
                    : "border-white/10 focus:ring-sky-500/70 focus:border-sky-500/70"
                }`}
                placeholder="Traveller123"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
              {errors.displayName && (
                <p className="text-[11px] text-red-400">{errors.displayName}</p>
              )}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">
              Email address
            </label>
            <input
              type="email"
              autoComplete="email"
              className={`w-full rounded-xl bg-slate-900/70 border px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 ${
                errors.email
                  ? "border-red-500/60 focus:ring-red-500/70"
                  : "border-white/10 focus:ring-sky-500/70 focus:border-sky-500/70"
              }`}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {errors.email && (
              <p className="text-[11px] text-red-400">{errors.email}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">
              Password
            </label>
            <input
              type="password"
              autoComplete={isLogin ? "current-password" : "new-password"}
              className={`w-full rounded-xl bg-slate-900/70 border px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 ${
                errors.password
                  ? "border-red-500/60 focus:ring-red-500/70"
                  : "border-white/10 focus:ring-sky-500/70 focus:border-sky-500/70"
              }`}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {errors.password && (
              <p className="text-[11px] text-red-400">{errors.password}</p>
            )}
            {!isLogin && !errors.password && (
              <p className="text-[10px] text-slate-500">
                At least 8 characters, no spaces.
              </p>
            )}
          </div>

          {errors.general && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/40 rounded-lg px-3 py-2">
              {errors.general}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 px-4 py-2.5 rounded-full bg-sky-500 hover:bg-sky-600 disabled:bg-sky-500/60 text-sm font-semibold text-white shadow-lg shadow-sky-500/40 transition-colors"
          >
            {loading
              ? isLogin
                ? "Logging in..."
                : "Creating account..."
              : isLogin
              ? "Log in"
              : "Sign up"}
          </button>
        </form>
      </div>
    </div>
  );
}
