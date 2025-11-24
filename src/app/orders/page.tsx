"use client";

import { usePosStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useMemo, useEffect, useState } from "react";

export default function OrdersPage() {
  const { orders, updateOrderStatus, initFromApi } = usePosStore();
  const [paymentFilter, setPaymentFilter] = useState<"all" | "cash" | "promptpay" | "card" | "unpaid">("all");

  useEffect(() => {
    const id = setInterval(() => {
      initFromApi?.();
    }, 5000);
    return () => clearInterval(id);
  }, [initFromApi]);

  const waitingOrders = useMemo(
    () =>
      [...orders]
        .filter((o) => o.fulfillmentStatus === "waiting")
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [orders],
  );

  const filteredHistory = useMemo(() => {
    if (paymentFilter === "all") return orders;
    if (paymentFilter === "unpaid") return orders.filter((o) => o.paymentStatus === "unpaid");
    return orders.filter((o) => o.paymentMethod === paymentFilter);
  }, [orders, paymentFilter]);

  const historySummary = useMemo(() => {
    const total = filteredHistory.reduce((sum, o) => sum + o.total, 0);
    return { total, count: filteredHistory.length };
  }, [filteredHistory]);

  const groupedHistory = useMemo(() => {
    const map = new Map<string, { date: string; total: number; orders: typeof orders }>();
    filteredHistory.forEach((o) => {
      const key = new Date(o.createdAt).toISOString().slice(0, 10);
      const current = map.get(key);
      if (current) {
        current.total += o.total;
        current.orders.push(o);
      } else {
        map.set(key, { date: key, total: o.total, orders: [o] as typeof orders });
      }
    });
    return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredHistory]);

  const exportCsv = () => {
    if (typeof window === "undefined") return;
    const rows = [
      ["orderNumber", "paymentStatus", "fulfillmentStatus", "paymentMethod", "total", "createdAt"],
      ...filteredHistory.map((o) => [
        o.orderNumber,
        o.paymentStatus,
        o.fulfillmentStatus,
        o.paymentMethod,
        o.total.toString(),
        o.createdAt,
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "orders.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-600">Queue & Sales history</p>
          <h1 className="text-2xl font-extrabold text-slate-900">Orders</h1>
        </div>
        <div className="text-right text-sm text-slate-700">
          <div className="font-semibold text-slate-900">ยอดขายรวม ฿ {orders.reduce((s, o) => s + o.total, 0).toFixed(2)}</div>
          <div>{orders.length} orders</div>
        </div>
      </div>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Queue (waiting)</CardTitle>
          <Badge tone="orange">{waitingOrders.length}</Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          {waitingOrders.map((order) => (
            <div
              key={order.id}
              className={`rounded-lg border p-3 shadow-sm ${order.paymentStatus === "paid" ? "bg-emerald-50 border-emerald-100" : "bg-amber-50 border-amber-100"}`}
            >
              <div className="flex items-center justify-between text-sm">
                <div className="font-semibold text-slate-900">{order.orderNumber}</div>
                <div className="flex items-center gap-2">
                  <Badge tone={order.paymentStatus === "paid" ? "green" : "orange"}>{order.paymentStatus}</Badge>
                  <span className="text-slate-600">{format(new Date(order.createdAt), "HH:mm")}</span>
                </div>
              </div>
              <ul className="mt-2 space-y-1 text-sm text-slate-900">
                {order.items.map((it) => (
                  <li key={it.productId} className="flex justify-between">
                    <span>
                      {it.qty} × {it.name}
                    </span>
                    <span>฿ {(it.unitPrice * it.qty).toFixed(0)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-slate-700">Pay: {order.paymentMethod}</span>
                <span className="font-semibold">฿ {order.total.toFixed(0)}</span>
              </div>
              <div className="mt-3">
                <Button
                  size="lg"
                  className="w-full justify-center"
                  variant="primary"
                  onClick={() => updateOrderStatus(order.id, "finished")}
                >
                  เสิร์ฟเค้กแล้ว
                </Button>
              </div>
            </div>
          ))}
          {waitingOrders.length === 0 && <div className="text-sm text-slate-600">ไม่มีออเดอร์ในคิว</div>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>Sales History</CardTitle>
            <div className="text-sm text-slate-600">
              บิล {historySummary.count} | ฿ {historySummary.total.toFixed(2)}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(["all", "cash", "promptpay", "card", "unpaid"] as const).map((p) => (
              <Button
                key={p}
                size="sm"
                variant={paymentFilter === p ? "primary" : "secondary"}
                onClick={() => setPaymentFilter(p)}
                className="capitalize"
              >
                {p}
              </Button>
            ))}
            <Button size="sm" variant="outline" onClick={exportCsv}>
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {groupedHistory.map((group) => (
            <div key={group.date} className="space-y-2 rounded-lg border border-slate-200 p-3">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-slate-900">{format(new Date(group.date), "dd MMM yyyy")}</div>
                <div className="text-sm font-semibold text-slate-800">฿ {group.total.toFixed(2)}</div>
              </div>
              <div className="space-y-1">
                {group.orders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-900">
                        <span>{order.orderNumber}</span>
                        <Badge tone={order.fulfillmentStatus === "finished" ? "green" : "gray"}>
                          {order.fulfillmentStatus}
                        </Badge>
                        <Badge tone={order.paymentStatus === "paid" ? "green" : "orange"}>{order.paymentStatus}</Badge>
                        <Badge tone="blue">{order.paymentMethod}</Badge>
                      </div>
                      <div className="text-xs text-slate-600">
                        {format(new Date(order.createdAt), "dd MMM yyyy HH:mm")}
                      </div>
                    </div>
                    <div className="text-right font-semibold text-slate-900">฿ {order.total.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {groupedHistory.length === 0 && <div className="text-sm text-slate-600">No orders</div>}
        </CardContent>
      </Card>
    </div>
  );
}
