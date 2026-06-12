"use client";

import { useState } from "react";

import { useAuth } from "@/context/auth-context";
import { useThemeMode } from "@/context/theme-context";

export function AppTopbar() {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useThemeMode();

  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const firstName = user?.name?.split(" ")[0] || "Admin";
  const initial = firstName.charAt(0).toUpperCase();

  return (
    <header className="px-4 pb-4 pt-5 lg:px-6">
      <div className="flex items-center justify-between gap-5">
        <div>
          <h1 className="text-[26px] font-medium tracking-[-0.04em] text-zinc-950">
            Welcome, {firstName} 👋
          </h1>
          <p className="mt-1 text-[13px] text-zinc-500">
            Here&apos;s what&apos;s happening in your gym today.
          </p>
        </div>

        <div className="relative">
          <div className="flex items-center gap-2 rounded-full bg-white/65 p-1.5 shadow-sm ring-1 ring-black/5">
            <button
              type="button"
              onClick={toggleTheme}
              className="grid size-10 place-items-center rounded-full bg-white text-[15px] text-zinc-700 shadow-sm ring-1 ring-black/5 transition hover:bg-[#e8ff5f] hover:text-zinc-950 focus:outline-none focus:ring-2 focus:ring-[#e8ff5f]"
              aria-label={
                isDarkMode ? "Switch to light mode" : "Switch to dark mode"
              }
              title={
                isDarkMode ? "Switch to light mode" : "Switch to dark mode"
              }
            >
              {isDarkMode ? "☀" : "☾"}
            </button>

            <button
              type="button"
              onClick={() => setIsProfileOpen((current) => !current)}
              className="grid size-10 place-items-center rounded-full bg-[#e8ff5f] text-[14px] font-medium text-zinc-950 shadow-sm ring-1 ring-black/10 transition hover:scale-95 focus:outline-none focus:ring-2 focus:ring-[#e8ff5f]"
              aria-label="Open profile menu"
            >
              {initial}
            </button>
          </div>

          {isProfileOpen ? (
            <div className="absolute right-0 top-14 z-50 w-64 overflow-hidden rounded-[1.4rem] bg-white p-2 shadow-[0_18px_50px_rgba(0,0,0,0.16)] ring-1 ring-black/10">
              <div className="rounded-[1.1rem] bg-[#f4f4f2] p-4">
                <p className="text-[13px] font-medium text-zinc-950">
                  {user?.name || "GymFlow Admin"}
                </p>
                <p className="mt-1 text-[12px] text-zinc-500">
                  {user?.email || "No email"}
                </p>
                <p className="mt-2 inline-flex rounded-full bg-white px-3 py-1 text-[11px] capitalize text-zinc-600 ring-1 ring-black/5">
                  {user?.role || "admin"}
                </p>
              </div>

              <button
                type="button"
                onClick={logout}
                className="mt-2 h-11 w-full rounded-full text-[13px] font-medium text-red-600 transition hover:bg-red-50"
              >
                Logout
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
