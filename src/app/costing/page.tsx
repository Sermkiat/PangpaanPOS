'use client';

import { usePosStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, THead, TBody, TH, TD } from '@/components/ui/table';

export default function CostingPage() {
  const { products, recipes } = usePosStore();

  const costing = products.map((product) => {
    const recipe = recipes.find((r) => r.productId === product.id);
    const batchCost = recipe?.items.reduce((sum, it) => sum + it.qty * it.costPerUnit, 0) ?? 0;
    const unitCost = recipe ? batchCost / recipe.yieldQty : 0;
    const gp = product.price - unitCost;
    const margin = product.price ? (gp / product.price) * 100 : 0;
    return { product, unitCost, gp, margin };
  });

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-orange-700">See product GP instantly</p>
        <h1 className="text-2xl font-extrabold text-orange-950">Product Cost Calculator</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Cost & GP</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <THead>
              <tr>
                <TH>Product</TH>
                <TH>Price</TH>
                <TH>Unit cost</TH>
                <TH>GP</TH>
                <TH>Margin</TH>
              </tr>
            </THead>
            <TBody>
              {costing.map((row) => (
                <tr key={row.product.id}>
                  <TD>{row.product.name}</TD>
                  <TD>฿ {row.product.price.toFixed(2)}</TD>
                  <TD>฿ {row.unitCost.toFixed(2)}</TD>
                  <TD>฿ {row.gp.toFixed(2)}</TD>
                  <TD className={row.margin >= 50 ? 'text-green-700 font-semibold' : 'text-orange-900'}>
                    {row.margin.toFixed(1)}%
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
