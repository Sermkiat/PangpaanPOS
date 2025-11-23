'use client';

import { useState } from 'react';
import { usePosStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, THead, TBody, TH, TD } from '@/components/ui/table';

export default function WastePage() {
  const { waste, addWaste, items } = usePosStore();
  const [form, setForm] = useState({ itemId: items[0]?.id ?? 0, qty: 0, reason: '' });

  const submit = () => {
    if (!form.itemId || !form.qty || !form.reason) return;
    addWaste(form);
    setForm((f) => ({ ...f, qty: 0, reason: '' }));
  };

  const findName = (id: number) => items.find((i) => i.id === id)?.name ?? 'Unknown';

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-orange-700">Loss tracking</p>
        <h1 className="text-2xl font-extrabold text-orange-950">Waste Log</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Record waste</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <Input
            list="waste-items"
            placeholder="Item ID"
            value={form.itemId || ''}
            onChange={(e) => setForm((f) => ({ ...f, itemId: Number(e.target.value) }))}
          />
          <datalist id="waste-items">
            {items.map((it) => (
              <option key={it.id} value={it.id}>{it.name}</option>
            ))}
          </datalist>
          <Input
            type="number"
            placeholder="Qty"
            value={form.qty || ''}
            onChange={(e) => setForm((f) => ({ ...f, qty: Number(e.target.value) }))}
          />
          <Input
            placeholder="Reason"
            value={form.reason}
            onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
          />
          <div className="md:col-span-3 flex justify-end">
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
                  <TD>{w.qty}</TD>
                  <TD>{w.reason}</TD>
                </tr>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
