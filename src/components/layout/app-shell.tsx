"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { BarChart3, CookingPot, Home, Layers, Receipt, Settings, ShoppingBag, ShoppingCart, Wallet, Wheat, CreditCard } from "lucide-react";
import pkg from "../../../package.json";
import React from "react";
import Image from "next/image";
import { CartFloatingButton } from "../CartFloatingButton";
import { usePosStore } from "@/lib/store";

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
  { href: "/debt-manager", label: "Debt Manager", icon: CreditCard },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { orders } = usePosStore();
  const badgeCount = React.useMemo(() => {
    return orders
      .filter((o) => o.status !== "served")
      .reduce((sum, o) => sum + (o.items?.reduce((s, it) => s + (it.qty || 0), 0) || 0), 0);
  }, [orders]);
  const buildId =
    process.env.NEXT_PUBLIC_BUILD_ID ||
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ||
    new Date().toISOString().slice(0, 10);
  const buildVersion = `build ${pkg.version} • ${buildId}`;

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header
        className="sticky top-0 z-20 border-b border-slate-200 bg-slate-900 text-white"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 8px)", paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 8px)" }}
      >
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-2">
          <div className="flex items-center gap-2">
            <Image src="/logo-pp.svg" alt="Pangpaan" width={40} height={40} className="rounded-md" />
            <div className="whitespace-nowrap">
              <div className="text-lg font-bold leading-tight">Pangpaan POS</div>
              <div className="text-xs text-white/80 leading-tight">{buildVersion}</div>
            </div>
          </div>
          <nav className="ml-auto flex items-center gap-2 overflow-x-auto rounded-full bg-slate-800/80 px-2 py-1 text-sm shadow-inner shadow-black/10">
            {navItems.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-full px-3 py-2 transition whitespace-nowrap",
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
      <CartFloatingButton itemCount={badgeCount} navigateToPOS={() => router.push("/pos")} />
    </div>
  );
}
