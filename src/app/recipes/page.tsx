'use client';

import { usePosStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, THead, TBody, TH, TD } from '@/components/ui/table';

function computeCostPerYield(cost: number, yieldQty: number) {
  if (yieldQty <= 0) return cost;
  return cost / yieldQty;
}

export default function RecipesPage() {
  const { recipes } = usePosStore();

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-orange-700">Build multi-level recipes</p>
        <h1 className="text-2xl font-extrabold text-orange-950">Recipes</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {recipes.map((recipe) => {
          const baseCost = recipe.items.reduce((sum, it) => sum + it.qty * it.costPerUnit, 0);
          const costPerYield = computeCostPerYield(baseCost, recipe.yieldQty);
          return (
            <Card key={recipe.id}>
              <CardHeader>
                <CardTitle>{recipe.name}</CardTitle>
                <p className="text-sm text-orange-700">Yield: {recipe.yieldQty} {recipe.yieldUnit}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <Table>
                  <THead>
                    <tr>
                      <TH>Item</TH>
                      <TH>Qty</TH>
                      <TH>Cost</TH>
                    </tr>
                  </THead>
                  <TBody>
                    {recipe.items.map((it) => (
                      <tr key={it.itemId}>
                        <TD>{it.itemName}</TD>
                        <TD>{it.qty}</TD>
                        <TD>฿ {(it.qty * it.costPerUnit).toFixed(2)}</TD>
                      </tr>
                    ))}
                  </TBody>
                </Table>
                <div className="flex items-center justify-between text-sm text-orange-900">
                  <span>Batch cost</span>
                  <span className="font-semibold">฿ {baseCost.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-orange-900">
                  <span>Cost per {recipe.yieldUnit}</span>
                  <span className="font-semibold">฿ {costPerYield.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
