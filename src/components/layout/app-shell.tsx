"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { BarChart3, CookingPot, Home, Layers, Receipt, Settings, ShoppingBag, ShoppingCart, Wallet, Wheat, CreditCard, Menu, X } from "lucide-react";
import pkg from "../../../package.json";
import React from "react";
import Image from "next/image";
import { CartFloatingButton } from "../CartFloatingButton";
import { DeliveryFloatingButton } from "../DeliveryFloatingButton";
import { SwReset } from "../sw-reset";
import { usePosStore } from "@/lib/store";
import { useCallback } from "react";

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
  const { orders, cartCount } = usePosStore();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const pendingDeliveries = React.useMemo(
    () => orders.filter((o) => o.fulfillmentStatus !== "finished").length,
    [orders],
  );

  const scrollToPay = useCallback(() => {
    if (typeof window === "undefined") return;
    const target = document.querySelector("[data-pay-button]");
    if (target instanceof HTMLElement) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, []);
  const badgeCount = React.useMemo(() => {
    return orders
      .filter((o) => o.fulfillmentStatus === "waiting")
      .reduce((sum, o) => sum + (o.items?.reduce((s, it) => s + (it.qty || 0), 0) || 0), 0);
  }, [orders]);
  const buildId =
    process.env.NEXT_PUBLIC_BUILD_ID ||
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ||
    new Date().toISOString().slice(0, 10);
  const buildVersion = `build ${pkg.version} • ${buildId}`;

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <SwReset />
      <header
        className="sticky top-0 z-20 border-b border-slate-200 bg-slate-900 text-white"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 8px)", paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 8px)" }}
      >
        <div className="relative mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-2">
          <div className="flex flex-shrink-0 items-center gap-2">
            <Image
              src="/logo-pp.svg"
              alt="Pangpaan"
              width={44}
              height={44}
              className="shrink-0 rounded-md"
              priority
            />
            <div className="flex min-w-0 flex-col">
              <span className="whitespace-nowrap text-lg font-bold leading-tight">Pangpaan POS</span>
              <span className="text-xs leading-tight text-white/70 sm:text-sm">{buildVersion}</span>
            </div>
          </div>

          <div className="flex min-w-0 flex-1 items-center gap-2 justify-end">
            <div className="ml-auto flex items-center gap-2 sm:hidden">
              <button
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-800/80 text-white"
                onClick={() => router.push("/dashboard")}
                aria-label="ไปหน้า Dashboard"
              >
                <Home size={18} />
              </button>
              <button
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-800/80 text-white"
                onClick={() => setMobileOpen((v) => !v)}
                aria-label="Toggle navigation"
              >
                {mobileOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>
            <nav className="hidden min-w-0 flex-1 items-center gap-3 overflow-hidden text-ellipsis whitespace-nowrap rounded-full bg-slate-800/80 px-2 py-1 text-sm shadow-inner shadow-black/10 sm:flex sm:w-auto sm:overflow-x-auto no-scrollbar">
              {navItems.map((item) => {
                const active = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex flex-shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-3 py-2 transition",
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

          {mobileOpen && (
            <div className="absolute left-0 right-0 top-full z-30 sm:hidden">
              <nav className="flex flex-col gap-4 py-4 bg-slate-900 text-white overflow-y-auto max-h-[70vh] px-4 shadow-lg shadow-black/20">
                {navItems.map((item) => {
                  const active = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2",
                        active ? "bg-white text-slate-900 shadow-sm" : "bg-white/5 hover:bg-white/10",
                      )}
                      onClick={() => setMobileOpen(false)}
                    >
                      <Icon size={16} />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          )}
        </div>
      </header>
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6">{children}</main>
      <footer className="border-t border-slate-200 bg-white py-3 text-center text-xs text-slate-500">
        Pangpaan POS · Offline-friendly PWA · Powered by Next.js + Express + Drizzle · CacheMarker: POS-2025-11-24-2308
      </footer>
      <DeliveryFloatingButton pendingDeliveries={pendingDeliveries} navigateToQueue={() => router.push("/orders")} />
      <CartFloatingButton
        itemCount={cartCount}
        navigateToPOS={() => {
          if (pathname === "/pos") {
            requestAnimationFrame(scrollToPay);
          } else {
            router.push("/pos");
            requestAnimationFrame(() => {
              if (typeof window !== "undefined") {
                window.dispatchEvent(new Event("scroll-to-pay"));
              }
            });
          }
        }}
        scrollToPay={() => {
          requestAnimationFrame(() => {
            if (typeof window !== "undefined") {
              window.dispatchEvent(new Event("scroll-to-pay"));
            }
          });
        }}
      />
    </div>
  );
}
