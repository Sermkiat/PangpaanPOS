"use client";

import { usePosStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useMemo, useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";

export default function OrdersPage() {
  const { orders, updateOrderStatus, initFromApi } = usePosStore();
  const [paymentFilter, setPaymentFilter] = useState<"all" | "cash" | "promptpay" | "card">("all");
  const [openOrderId, setOpenOrderId] = useState<number | null>(null);
  const [payMethod, setPayMethod] = useState<"cash" | "promptpay">("cash");
  const [cashValue, setCashValue] = useState<string>("");

  useEffect(() => {
    initFromApi?.();
  }, [initFromApi]);

  const waitingOrders = useMemo(
    () =>
      [...orders]
        .filter((o) => o.fulfillmentStatus === "waiting")
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [orders],
  );

  const completedOrders = useMemo(
    () => orders.filter((o) => o.paymentStatus === "paid" && o.fulfillmentStatus === "finished"),
    [orders],
  );

  const filteredHistory = useMemo(() => {
    if (paymentFilter === "all") return completedOrders;
    return completedOrders.filter((o) => o.paymentMethod === paymentFilter);
  }, [completedOrders, paymentFilter]);

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
            <div className="font-semibold text-slate-900">ยอดขายรวม ฿ {completedOrders.reduce((s, o) => s + o.total, 0).toFixed(2)}</div>
            <div>{completedOrders.length} orders</div>
          </div>
      </div>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Queue (waiting)</CardTitle>
          <Badge tone="orange">{waitingOrders.length}</Badge>
        </CardHeader>
        <CardContent className="grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
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
              {order.note && (
                <div className="mt-2 rounded-lg bg-white/60 px-3 py-2 text-sm text-slate-800">
                  โน้ต: {order.note}
                </div>
              )}
              <div className="mt-3">
                <Dialog open={openOrderId === order.id} onOpenChange={(v) => setOpenOrderId(v ? order.id : null)}>
                  <DialogTrigger asChild>
                    <Button
                      size="lg"
                      className="w-full justify-center"
                      variant="primary"
                      onClick={() => {
                        setOpenOrderId(order.id);
                        const fallbackMethod = order.paymentMethod === "promptpay" ? "promptpay" : "cash";
                        setPayMethod(order.paymentStatus === "unpaid" ? "cash" : fallbackMethod);
                        // เริ่มต้นให้ผู้ใช้กรอกเองเสมอ
                        setCashValue("");
                      }}
                    >
                      ลูกค้าจ่าย/รับแล้ว
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>สรุปรายการขาย</DialogTitle>
                      <DialogDescription>{order.orderNumber}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 text-sm text-slate-800 max-h-[70vh] overflow-auto">
                      <div className="flex justify-between font-semibold">
                        <span>Total</span>
                        <span>฿ {order.total.toFixed(2)}</span>
                      </div>

                      {order.paymentStatus === "unpaid" ? (
                        <div className="space-y-3">
                          <div className="flex gap-2">
                            {(["cash", "promptpay"] as const).map((method) => {
                              const active = payMethod === method;
                              return (
                                <button
                                  key={method}
                                  type="button"
                                  onClick={() => setPayMethod(method)}
                                  className={`flex-1 rounded-lg border px-3 py-2 font-semibold capitalize ${
                                    active ? "border-emerald-500 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-white text-slate-800"
                                  }`}
                                >
                                  {method}
                                </button>
                              );
                            })}
                          </div>

                          {payMethod === "cash" && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold">เงินรับมา</span>
                                <input
                                  type="number"
                                  inputMode="decimal"
                                  step="0.01"
                                  className="h-10 w-28 rounded border border-slate-200 px-2 text-right"
                                  value={cashValue}
                                  onChange={(e) => setCashValue(e.target.value)}
                                  placeholder="0.00"
                                />
                              </div>
                              <div className="grid grid-cols-4 gap-2">
                                {[1, 5, 10, 20, 50, 100, 500, 1000].map((amt) => (
                                  <button
                                    key={amt}
                                    type="button"
                                    onClick={() => setCashValue(((Number(cashValue) || 0) + amt).toFixed(2))}
                                    className="rounded-lg bg-slate-100 px-2 py-1 text-sm font-semibold text-slate-800 hover:bg-slate-200"
                                  >
                                    +{amt}
                                  </button>
                                ))}
                                <button
                                  type="button"
                                  className="col-span-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                                  onClick={() => setCashValue(order.total.toFixed(2))}
                                >
                                  Exact
                                </button>
                                <button
                                  type="button"
                                  className="col-span-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                                  onClick={() => setCashValue("")}
                                >
                                  Clear Cash
                                </button>
                              </div>
                              <div className="flex justify-between font-semibold">
                                <span>เงินทอน</span>
                                <span>฿ {Math.max(0, (Number(cashValue) || 0) - order.total).toFixed(2)}</span>
                              </div>
                            </div>
                          )}

                          {payMethod === "promptpay" && (
                            <div className="space-y-2 rounded-lg bg-slate-50 px-3 py-3 text-center">
                              <div className="text-sm font-semibold text-slate-900">สแกน PromptPay</div>
                              <img
                                src="https://promptpay.io/0868938788.png"
                                alt="PromptPay QR"
                                className="mx-auto h-56 w-56 object-contain"
                              />
                              <div className="text-sm font-semibold text-slate-900">฿ {order.total.toFixed(2)}</div>
                            </div>
                          )}

                          <div className="rounded-lg bg-slate-50 px-3 py-2">
                            <div className="text-xs text-slate-600">สถานะปัจจุบัน</div>
                            <div className="flex justify-between font-semibold">
                              <span>ชำระ</span>
                              <span className="text-amber-700">ยังไม่จ่าย</span>
                            </div>
                            <div className="flex justify-between font-semibold">
                              <span>รับสินค้า</span>
                              <span className="text-amber-700">ยังไม่รับ</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-lg bg-slate-50 px-3 py-2 space-y-1">
                          <div className="flex justify-between font-semibold">
                            <span>สถานะชำระ</span>
                            <span className="text-emerald-700">จ่ายแล้ว</span>
                          </div>
                          <div className="flex justify-between font-semibold">
                            <span>สถานะรับสินค้า</span>
                            <span className="text-amber-700">ยังไม่รับ</span>
                          </div>
                        </div>
                      )}

                      <div className="border-t pt-2 space-y-1">
                        <div className="font-semibold">สินค้า</div>
                        {order.items.map((it) => (
                          <div key={it.productId} className="flex justify-between">
                            <span>
                              {it.qty} × {it.name}
                            </span>
                            <span>฿ {(it.unitPrice * it.qty).toFixed(2)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between font-semibold pt-1">
                          <span>รวม</span>
                          <span>฿ {order.total.toFixed(2)}</span>
                        </div>
                        {order.note && (
                          <div className="rounded-lg bg-slate-50 px-3 py-2 text-slate-800">
                            โน้ต: {order.note}
                          </div>
                        )}
                        <div className="text-xs text-slate-500">
                          เปิดบิล: {order.createdAt ? format(new Date(order.createdAt), "dd MMM yyyy HH:mm") : "-"}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button variant="outline" className="flex-1" onClick={() => setOpenOrderId(null)}>
                        ยกเลิก
                      </Button>
                      <Button
                        className="flex-1"
                        disabled={order.paymentStatus === "unpaid" && payMethod === "cash" && (Number(cashValue) || 0) + 0.0001 < order.total}
                        onClick={async () => {
                          const now = new Date().toISOString();
                          const paidAt = order.paymentStatus === "paid" ? order.paidAt ?? now : now;
                          const servedAt = now;
                          const cashReceived = order.paymentStatus === "unpaid" ? (payMethod === "cash" ? Number(cashValue) || 0 : order.total) : order.cashReceived ?? order.total;
                          const change = payMethod === "cash" ? Math.max(0, (Number(cashValue) || 0) - order.total) : 0;
                          await updateOrderStatus(order.id, "finished", "paid", paidAt, servedAt, payMethod, cashReceived, change);
                          setOpenOrderId(null);
                        }}
                      >
                        {order.paymentStatus === "unpaid" ? "ยืนยันชำระ/รับแล้ว" : "ยืนยันส่งมอบ"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
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
            {(["all", "cash", "promptpay", "card"] as const).map((p) => (
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
                  <Dialog key={order.id} open={openOrderId === order.id} onOpenChange={(v) => setOpenOrderId(v ? order.id : null)}>
                    <DialogTrigger asChild>
                      <button
                        className="flex w-full items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-left hover:bg-slate-50"
                        onClick={() => setOpenOrderId(order.id)}
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
                      </button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>รายละเอียดออเดอร์</DialogTitle>
                        <DialogDescription>{order.orderNumber}</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-2 text-sm text-slate-800">
                        <div className="flex justify-between">
                          <span>สถานะชำระ</span>
                          <span className={order.paymentStatus === "paid" ? "text-emerald-700 font-semibold" : "text-amber-700 font-semibold"}>
                            {order.paymentStatus}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>สถานะส่งมอบ</span>
                          <span className={order.fulfillmentStatus === "finished" ? "text-emerald-700 font-semibold" : "text-amber-700 font-semibold"}>
                            {order.fulfillmentStatus}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>ชำระแบบ</span>
                          <span className="capitalize font-semibold">{order.paymentMethod}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>เปิดบิล</span>
                          <span>{order.createdAt ? format(new Date(order.createdAt), "dd MMM yyyy HH:mm") : "-"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>จ่ายเงิน</span>
                          <span>{order.paidAt ? format(new Date(order.paidAt), "dd MMM yyyy HH:mm") : "-"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>ส่งมอบ</span>
                          <span>{order.servedAt ? format(new Date(order.servedAt), "dd MMM yyyy HH:mm") : "-"}</span>
                        </div>
                        {(() => {
                          const paid = order.paymentStatus === "paid";
                          const received =
                            order.cashReceived ??
                            (order.change != null ? order.total + order.change : paid ? order.total : null);
                          const computedChange =
                            order.change ??
                            (paid && order.paymentMethod === "cash" && received != null ? Math.max(0, received - order.total) : null);
                          return (
                            <>
                              <div className="flex justify-between pt-1">
                                <span>เงินรับมา</span>
                                <span>{received != null ? `฿ ${received.toFixed(2)}` : "-"}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>เงินทอน</span>
                                <span>{computedChange != null ? `฿ ${computedChange.toFixed(2)}` : "-"}</span>
                              </div>
                            </>
                          );
                        })()}
                        {order.note && (
                          <div className="rounded-lg bg-slate-50 px-3 py-2 text-slate-800">
                            โน้ต: {order.note}
                          </div>
                        )}
                        <div className="mt-2 space-y-1 border-t border-slate-200 pt-2 text-slate-800">
                          <div className="font-semibold">สินค้า</div>
                          {order.items.map((it) => (
                            <div key={it.productId} className="flex justify-between text-sm">
                              <span>{it.qty} × {it.name}</span>
                              <span>฿ {(it.unitPrice * it.qty).toFixed(2)}</span>
                            </div>
                          ))}
                          <div className="flex justify-between font-semibold pt-2">
                            <span>Total</span>
                            <span>฿ {order.total.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
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
