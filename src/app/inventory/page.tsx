'use client';

import { usePosStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, THead, TBody, TH, TD } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

export default function InventoryPage() {
  const { items, adjustItemStock } = usePosStore();
  const [adjustments, setAdjustments] = useState<Record<number, number>>({});

  const applyAdjust = (id: number) => {
    const delta = adjustments[id] ?? 0;
    adjustItemStock(id, delta);
    setAdjustments((prev) => ({ ...prev, [id]: 0 }));
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-orange-700">Ingredients and supplies</p>
        <h1 className="text-2xl font-extrabold text-orange-950">Inventory</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <THead>
              <tr>
                <TH>Item</TH>
                <TH>Stock</TH>
                <TH>Cost/unit</TH>
                <TH>Reorder</TH>
                <TH>Adjust</TH>
              </tr>
            </THead>
            <TBody>
              {items.map((it) => (
                <tr key={it.id} className={it.stockQty <= it.reorderPoint ? 'bg-red-50/60' : ''}>
                  <TD>
                    <div className="font-semibold text-orange-950">{it.name}</div>
                    <div className="text-xs text-orange-700">{it.code}</div>
                  </TD>
                  <TD className="text-orange-900 font-semibold">{it.stockQty.toFixed(1)} {it.unit}</TD>
                  <TD>฿ {it.costPerUnit.toFixed(3)}</TD>
                  <TD>{it.reorderPoint.toFixed(0)}</TD>
                  <TD>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        className="w-24"
                        value={adjustments[it.id] ?? ''}
                        placeholder="+/-"
                        onChange={(e) => setAdjustments((prev) => ({ ...prev, [it.id]: Number(e.target.value) }))}
                      />
                      <Button size="sm" variant="primary" onClick={() => applyAdjust(it.id)}>
                        Apply
                      </Button>
                    </div>
                  </TD>
                </tr>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
