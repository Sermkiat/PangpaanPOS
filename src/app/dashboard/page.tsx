"use client";

import Link from "next/link";
import { useMemo, useEffect } from "react";
import { usePosStore } from "@/lib/store";
import { useDebtStore } from "@/store/debtStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { BarChart3, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const isSameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const isSameMonth = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();

export default function DashboardPage() {
  const { orders, expenses, waste, items } = usePosStore();
  const { summary, fetchSummary } = useDebtStore();

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const metrics = useMemo(() => {
    const today = new Date();

    const revenueToday = orders.reduce((sum, o) => (isSameDay(new Date(o.createdAt), today) ? sum + o.total : sum), 0);
    const revenueMonth = orders.reduce((sum, o) => (isSameMonth(new Date(o.createdAt), today) ? sum + o.total : sum), 0);

    const expensesToday = expenses.reduce((sum, e) => (isSameDay(new Date(e.date), today) ? sum + e.amount : sum), 0);
    const expensesMonth = expenses.reduce((sum, e) => (isSameMonth(new Date(e.date), today) ? sum + e.amount : sum), 0);

    const wasteCostToday = waste.reduce((sum, w) => {
      if (!isSameDay(new Date(w.date), today)) return sum;
      const item = items.find((i) => i.id === w.itemId);
      const cost = Number(item?.costPerUnit ?? 0);
      return sum + Number(w.qty ?? 0) * cost;
    }, 0);
    const wasteCostMonth = waste.reduce((sum, w) => {
      if (!isSameMonth(new Date(w.date), today)) return sum;
      const item = items.find((i) => i.id === w.itemId);
      const cost = Number(item?.costPerUnit ?? 0);
      return sum + Number(w.qty ?? 0) * cost;
    }, 0);

    const gpToday = revenueToday - expensesToday - wasteCostToday;
    const gpMonth = revenueMonth - expensesMonth - wasteCostMonth;
    const openOrders = orders.filter((o) => o.fulfillmentStatus === "waiting").length;

    return { revenueToday, revenueMonth, expensesToday, expensesMonth, wasteCostToday, wasteCostMonth, gpToday, gpMonth, openOrders };
  }, [orders, expenses, waste, items]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-orange-700">Pangpaan POS System</p>
          <h1 className="text-3xl font-extrabold text-orange-950">Dashboard</h1>
          <p className="text-sm text-orange-700">Sales · Cost · Waste · GP</p>
        </div>
        <div className="flex gap-2">
          <Link href="/pos" className={cn(buttonVariants({ variant: "secondary", size: "lg" }), "gap-2")}>
            Go to POS
          </Link>
          <Link href="/orders" className={cn(buttonVariants({ size: "lg" }), "gap-2 flex items-center")}> 
            <BarChart3 size={18} />Orders Queue
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Revenue (today)" value={`฿ ${metrics.revenueToday.toFixed(0)}`} detail="All payment methods" />
        <StatCard title="Open Orders" value={`${metrics.openOrders}`} detail="Pending + Prepping" tone="orange" />
        <StatCard title="Expenses (month)" value={`฿ ${metrics.expensesMonth.toFixed(0)}`} detail="Logged expenses" tone="gray" />
        <StatCard
          title="Gross Profit (today)"
          value={`฿ ${metrics.gpToday.toFixed(0)}`}
          detail={`Waste: ฿ ${metrics.wasteCostToday.toFixed(0)}`}
          tone={metrics.gpToday >= 0 ? "green" : "red"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="bg-gradient-to-br from-orange-50 to-white border-orange-100">
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle className="text-orange-900 text-sm">Monthly Snapshot</CardTitle>
              <p className="text-xs text-orange-700">ยอดรวมเดือนปัจจุบัน</p>
            </div>
            <Badge tone="orange">Live</Badge>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 text-sm">
            <Metric label="Revenue (month)" value={`฿ ${metrics.revenueMonth.toFixed(0)}`} />
            <Metric label="Expenses (month)" value={`฿ ${metrics.expensesMonth.toFixed(0)}`} />
            <Metric label="Waste cost (month)" value={`฿ ${metrics.wasteCostMonth.toFixed(0)}`} />
            <Metric label="GP (month)" value={`฿ ${metrics.gpMonth.toFixed(0)}`} emphasis={metrics.gpMonth >= 0} />
          </CardContent>
        </Card>

        <Card className="bg-emerald-50 border-emerald-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-emerald-900 text-sm">เป้ากันหนี้เดือนนี้</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-emerald-800">฿ {summary?.remaining?.toLocaleString("th-TH") ?? "0"}</div>
              <div className="text-xs text-emerald-700">เหลือกันอีกในเดือนนี้</div>
            </div>
            <div className="text-sm text-emerald-700">สะสมแล้ว: ฿ {summary?.monthCollected?.toLocaleString("th-TH") ?? "0"}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Operations Snapshot</CardTitle>
          <Badge tone="orange">Live</Badge>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <OpsTile title="Orders" value={`${orders.length} total`} note="See kitchen queue" href="/orders" />
          <OpsTile title="Inventory" value="Stock & reorder" note="Update items" href="/inventory" />
          <OpsTile title="Recipes" value="Cost per product" note="Mini builder" href="/recipes" />
          <OpsTile title="Costing" value="GP & portion" note="Product cost calculator" href="/costing" />
          <OpsTile title="Expenses" value="Log spending" note="Utilities, labor, etc." href="/expenses" />
          <OpsTile title="Waste" value="Track loss" note="Spillage, spoilage" href="/waste" />
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ title, value, detail, tone = "green" }: { title: string; value: string; detail: string; tone?: "green" | "orange" | "gray" | "red" }) {
  const colorMap: Record<string, string> = {
    green: "from-green-100 to-emerald-50 text-emerald-900",
    orange: "from-orange-100 to-amber-50 text-orange-900",
    gray: "from-slate-100 to-white text-slate-900",
    red: "from-red-100 to-rose-50 text-rose-900",
  };
  return (
    <Card className={`bg-gradient-to-br ${colorMap[tone]}`}>
      <CardContent className="space-y-1">
        <p className="text-sm text-slate-700">{title}</p>
        <p className="text-2xl font-extrabold">{value}</p>
        <p className="text-xs text-slate-600">{detail}</p>
      </CardContent>
    </Card>
  );
}

function OpsTile({ title, value, note, href }: { title: string; value: string; note: string; href: string }) {
  return (
    <a
      href={href}
      className="flex flex-col gap-2 rounded-xl border border-orange-100 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-orange-950">{title}</h3>
        <PlusCircle size={18} className="text-orange-500" />
      </div>
      <div className="text-sm text-orange-800">{value}</div>
      <div className="text-xs text-orange-600">{note}</div>
    </a>
  );
}

function Metric({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg bg-white/60 p-3">
      <span className="text-xs text-slate-600">{label}</span>
      <span className={`text-lg font-semibold ${emphasis ? "text-emerald-700" : "text-slate-900"}`}>{value}</span>
    </div>
  );
}
