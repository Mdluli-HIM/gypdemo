"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: "▦" },
  { label: "Members", href: "/members", icon: "◉" },
  { label: "Check-in", href: "/check-in", icon: "⇥" },
  { label: "Payments", href: "/payments", icon: "₿" },
  { label: "Plans", href: "/plans", icon: "◇" },
  { label: "Subscriptions", href: "/subscriptions", icon: "↻" },
  { label: "Reminders", href: "/reminders", icon: "✦" },
  { label: "Reports", href: "/reports", icon: "▤" },
  { label: "Settings", href: "/settings", icon: "⚙" },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full shrink-0 px-3 py-5 lg:w-[190px]">
      <div className="mb-9 flex items-center gap-3 px-1">
        <div className="grid size-10 place-items-center rounded-full bg-zinc-950 text-lg text-white">
          ✶
        </div>
        <div>
          <p className="text-[15px] font-medium leading-none text-zinc-950">
            GymFlow
          </p>
          <p className="mt-1 text-[11px] text-zinc-500">Admin</p>
        </div>
      </div>

      <nav className="space-y-2">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex h-11 items-center gap-3 rounded-full px-4 text-[13px] transition ${
                isActive
                  ? "bg-[#e8ff5f] text-zinc-950 shadow-sm"
                  : "bg-white/45 text-zinc-700 hover:bg-white hover:text-zinc-950"
              }`}
            >
              <span className="grid size-5 place-items-center text-[13px]">
                {item.icon}
              </span>
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
