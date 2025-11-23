"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BarChart3, CookingPot, Home, Layers, Receipt, Settings, ShoppingBag, ShoppingCart, Wallet, Wheat } from "lucide-react";
import React from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/pos", label: "POS", icon: ShoppingCart },
  { href: "/orders", label: "Orders", icon: CookingPot },
  { href: "/inventory", label: "Inventory", icon: Wheat },
  { href: "/recipes", label: "Recipes", icon: Layers },
  { href: "/costing", label: "Costing", icon: Receipt },
  { href: "/expenses", label: "Expense Log", icon: Wallet },
  { href: "/waste", label: "Waste", icon: ShoppingBag },
  { href: "/allocation-rules", label: "Allocation", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-slate-900 text-white">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500 text-emerald-950 font-extrabold shadow-md shadow-emerald-200">
              PP
            </div>
            <div>
              <div className="text-lg font-bold">Pangpaan POS</div>
              <div className="text-xs text-white/80">Minimal, fast, iPad-friendly</div>
            </div>
          </div>
          <nav className="ml-auto hidden items-center gap-2 rounded-full bg-slate-800/80 px-2 py-1 text-sm shadow-inner shadow-black/10 md:flex">
            {navItems.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-full px-3 py-2 transition",
                    active ? "bg-white text-slate-900 shadow-sm" : "text-white/80 hover:bg-white/10",
                  )}
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6">{children}</main>
      <footer className="border-t border-slate-200 bg-white py-3 text-center text-xs text-slate-500">
        Pangpaan POS · Offline-friendly PWA · Powered by Next.js + Express + Drizzle
      </footer>
    </div>
  );
}
