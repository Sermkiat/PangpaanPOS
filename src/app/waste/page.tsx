"use client";

import { useEffect, useState } from "react";
import { usePosStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, THead, TBody, TH, TD } from "@/components/ui/table";

const reasons = ["expired", "spoil", "broken", "other"];

export default function WastePage() {
  const { waste, addWaste, items, adjustItemStock } = usePosStore();
  const [form, setForm] = useState({ itemId: 0, qty: 0, reason: "expired" });

  useEffect(() => {
    if (items.length && form.itemId === 0) {
      setForm((f) => ({ ...f, itemId: items[0].id }));
    }
  }, [items, form.itemId]);

  const submit = async () => {
    if (!form.itemId || !form.qty || !form.reason) return;
    await addWaste(form);
    // stock already deducted in API; ensure UI state updates as well
    await adjustItemStock(form.itemId, 0, "");
    setForm((f) => ({ ...f, qty: 0, reason: "expired" }));
  };

  const findName = (id: number) => items.find((i) => i.id === id)?.name ?? "Unknown";

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-orange-700">Loss tracking</p>
        <h1 className="text-2xl font-extrabold text-orange-950">Waste Log</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Record waste (ตัดสต็อกอัตโนมัติ)</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <select
            className="rounded-md border px-3 py-2 text-sm"
            value={form.itemId}
            onChange={(e) => setForm((f) => ({ ...f, itemId: Number(e.target.value) }))}
          >
            {items.map((it) => (
              <option key={it.id} value={it.id}>
                {it.name}
              </option>
            ))}
          </select>
          <Input
            type="number"
            placeholder="Qty"
            value={form.qty || ""}
            onChange={(e) => setForm((f) => ({ ...f, qty: Number(e.target.value) }))}
          />
          <select
            className="rounded-md border px-3 py-2 text-sm"
            value={form.reason}
            onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
          >
            {reasons.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <div className="flex items-center justify-end">
            <Button onClick={submit}>Save waste</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent waste</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <THead>
              <tr>
                <TH>When</TH>
                <TH>Item</TH>
                <TH>Qty</TH>
                <TH>Reason</TH>
              </tr>
            </THead>
            <TBody>
              {waste.map((w) => (
                <tr key={w.id}>
                  <TD>{new Date(w.date).toLocaleString()}</TD>
                  <TD>{findName(w.itemId)}</TD>
                  <TD className="text-rose-700 font-semibold">-{w.qty}</TD>
                  <TD className="capitalize">{w.reason}</TD>
                </tr>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
