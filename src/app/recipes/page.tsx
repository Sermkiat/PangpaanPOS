"use client";

import { useEffect, useMemo, useState } from "react";
import { usePosStore, RecipeItem } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TH, TD } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const emptyLine = (): RecipeItem => ({ itemId: 0, qty: 0 });

export default function RecipesPage() {
  const { recipes, products, items, saveRecipe, fetchRecipes } = usePosStore();
  const [productId, setProductId] = useState<number | undefined>(products[0]?.id);
  const [name, setName] = useState("");
  const [yieldQty, setYieldQty] = useState(1);
  const [yieldUnit, setYieldUnit] = useState("unit");
  const [lines, setLines] = useState<RecipeItem[]>([emptyLine()]);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  useEffect(() => {
    if (products.length && !productId) {
      setProductId(products[0].id);
    }
  }, [products, productId]);

  const ingredientOptions = items;

  const cost = useMemo(() => {
    return lines.reduce((sum, line) => {
      const item = ingredientOptions.find((i) => i.id === line.itemId);
      const costPerUnit = item?.costPerUnit ?? 0;
      return sum + (line.qty || 0) * costPerUnit;
    }, 0);
  }, [ingredientOptions, lines]);

  const costPerUnit = yieldQty > 0 ? cost / yieldQty : cost;

  const addLine = () => setLines((prev) => [...prev, emptyLine()]);
  const removeLine = (idx: number) => setLines((prev) => prev.filter((_, i) => i !== idx));

  const updateLine = (idx: number, data: Partial<RecipeItem>) => {
    setLines((prev) => prev.map((line, i) => (i === idx ? { ...line, ...data } : line)));
  };

  const submit = async () => {
    if (!productId) return;
    const filtered = lines.filter((l) => l.itemId && l.qty > 0);
    if (!filtered.length) return;
    await saveRecipe(productId, { name: name || undefined, yieldQty, yieldUnit, items: filtered });
    setName("");
    setYieldQty(1);
    setYieldUnit("unit");
    setLines([emptyLine()]);
    fetchRecipes();
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-orange-700">สูตรผลิต + คำนวณต้นทุน</p>
        <h1 className="text-2xl font-extrabold text-orange-950">Recipes</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recipe Builder</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid gap-3 md:grid-cols-3">
            <select
              className="rounded-md border px-3 py-2 text-sm"
              value={productId}
              onChange={(e) => setProductId(Number(e.target.value))}
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <Input placeholder="Recipe name (optional)" value={name} onChange={(e) => setName(e.target.value)} />
            <div className="flex gap-2">
              <Input
                type="number"
                className="w-24"
                placeholder="Yield"
                value={yieldQty}
                onChange={(e) => setYieldQty(Number(e.target.value))}
              />
              <Input
                className="flex-1"
                placeholder="Unit"
                value={yieldUnit}
                onChange={(e) => setYieldUnit(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            {lines.map((line, idx) => (
              <div key={idx} className="grid items-center gap-2 md:grid-cols-4">
                <select
                  className="rounded-md border px-3 py-2 text-sm"
                  value={line.itemId || ""}
                  onChange={(e) => updateLine(idx, { itemId: Number(e.target.value) })}
                >
                  <option value="">เลือกวัตถุดิบ</option>
                  {ingredientOptions.map((it) => (
                    <option key={it.id} value={it.id}>
                      {it.name} (฿{it.costPerUnit.toFixed(2)}/{it.unit})
                    </option>
                  ))}
                </select>
                <Input
                  type="number"
                  placeholder="Qty"
                  value={line.qty || ""}
                  onChange={(e) => updateLine(idx, { qty: Number(e.target.value) })}
                />
                <div className="text-sm text-slate-700">
                  ฿ {(function () {
                    const item = ingredientOptions.find((i) => i.id === line.itemId);
                    const costPerUnit = item?.costPerUnit ?? 0;
                    return ((line.qty || 0) * costPerUnit).toFixed(2);
                  })()}
                </div>
                <div className="flex justify-end">
                  <Button size="sm" variant="outline" onClick={() => removeLine(idx)}>
                    Remove
                  </Button>
                </div>
              </div>
            ))}
            <Button size="sm" variant="secondary" onClick={addLine}>
              + เพิ่มวัตถุดิบ
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-sm">
            <div className="space-y-1">
              <div className="text-slate-700">ต้นทุนรวมแบทช์</div>
              <div className="text-lg font-semibold text-orange-900">฿ {cost.toFixed(2)}</div>
            </div>
            <div className="space-y-1 text-right">
              <div className="text-slate-700">ต้นทุนต่อ {yieldUnit}</div>
              <div className="text-lg font-semibold text-orange-900">฿ {costPerUnit.toFixed(2)}</div>
            </div>
            <Button variant="primary" onClick={submit}>
              Save Recipe
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {recipes.map((recipe) => {
          const baseCost = recipe.items.reduce((sum, it) => sum + it.qty * (it.costPerUnit ?? 0), 0);
          const costPerYield = recipe.yieldQty > 0 ? baseCost / recipe.yieldQty : baseCost;
          return (
            <Card key={recipe.id}>
              <CardHeader>
                <CardTitle>{recipe.name}</CardTitle>
                <p className="text-sm text-orange-700">
                  Yield: {recipe.yieldQty} {recipe.yieldUnit}
                </p>
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
                        <TD>{it.itemName || it.itemId}</TD>
                        <TD>{it.qty}</TD>
                        <TD>฿ {(it.qty * (it.costPerUnit ?? 0)).toFixed(2)}</TD>
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
