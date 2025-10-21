"use client";

import { useEffect, useState } from "react";
import { signUp, signIn, logOut, onUserChanged } from "../lib/auth";

export default function AuthTest() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsub = onUserChanged(setUser);
    return () => unsub();
  }, []);

  if (user) {
    return (
      <div className="my-4 text-center">
        <p>Welcome, {user.email}</p>
        <button
          onClick={logOut}
          className="bg-red-500 text-white p-2 rounded mt-2"
        >
          Log out
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 my-6">
      <input
        type="email"
        placeholder="Email"
        className="w-72 rounded-lg border border-gray-500 bg-white/90 p-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        className="w-72 rounded-lg border border-gray-500 bg-white/90 p-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <div className="flex gap-2">
        <button
          onClick={() => signIn(email, password)}
          className="bg-blue-500 text-white p-2 rounded"
        >
          Login
        </button>
        <button
          onClick={() => signUp(email, password)}
          className="bg-green-500 text-white p-2 rounded"
        >
          Register
        </button>
      </div>
    </div>
  );
}
