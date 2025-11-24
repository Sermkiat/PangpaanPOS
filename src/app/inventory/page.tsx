'use client';

import { usePosStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, THead, TBody, TH, TD } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMemo, useState } from 'react';

export default function InventoryPage() {
  const { items, adjustItemStock, products, addProduct, toggleProductActive, removeProduct } = usePosStore();
  const [adjustments, setAdjustments] = useState<Record<number, number>>({});
  const [newProduct, setNewProduct] = useState({
    name: '',
    sku: '',
    category: '',
    price: 0,
    imageUrl: '',
    active: true,
  });

  const categories = useMemo(() => Array.from(new Set(products.map((p) => p.category))).filter(Boolean), [products]);

  const applyAdjust = (id: number) => {
    const delta = adjustments[id] ?? 0;
    adjustItemStock(id, delta);
    setAdjustments((prev) => ({ ...prev, [id]: 0 }));
  };

  const handleImageUpload = (file?: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setNewProduct((p) => ({ ...p, imageUrl: result }));
    };
    reader.readAsDataURL(file);
  };

  const submitProduct = () => {
    if (!newProduct.name || !newProduct.sku || !newProduct.category || newProduct.price <= 0) return;
    addProduct({ ...newProduct });
    setNewProduct({ name: '', sku: '', category: '', price: 0, imageUrl: '', active: true });
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-slate-600">Ingredients, supplies, and product catalog</p>
        <h1 className="text-2xl font-extrabold text-slate-900">Inventory & Products</h1>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Add / Update Product</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Name"
                value={newProduct.name}
                onChange={(e) => setNewProduct((p) => ({ ...p, name: e.target.value }))}
              />
              <Input
                placeholder="SKU"
                value={newProduct.sku}
                onChange={(e) => setNewProduct((p) => ({ ...p, sku: e.target.value }))}
              />
              <Input
                placeholder="หมวดสินค้า"
                list="cat-list"
                value={newProduct.category}
                onChange={(e) => setNewProduct((p) => ({ ...p, category: e.target.value }))}
              />
              <Input
                type="number"
                placeholder="Price"
                value={newProduct.price || ''}
                onChange={(e) => setNewProduct((p) => ({ ...p, price: Number(e.target.value) }))}
              />
              <Input
                placeholder="Image URL (optional)"
                className="col-span-2"
                value={newProduct.imageUrl}
                onChange={(e) => setNewProduct((p) => ({ ...p, imageUrl: e.target.value }))}
              />
              <div className="col-span-2 flex items-center gap-2 text-xs text-slate-600">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e.target.files?.[0] || null)}
                />
                <span>หรืออัปโหลดรูป</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={newProduct.active}
                  onChange={(e) => setNewProduct((p) => ({ ...p, active: e.target.checked }))}
                />
                Active
              </label>
              <Button variant="primary" onClick={submitProduct}>
                Save Product
              </Button>
            </div>
            <datalist id="cat-list">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inventory</CardTitle>
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
                  <tr key={it.id} className={it.stockQty <= it.reorderPoint ? 'bg-rose-50' : ''}>
                    <TD>
                      <div className="font-semibold text-slate-900">{it.name}</div>
                      <div className="text-xs text-slate-600">{it.code}</div>
                    </TD>
                    <TD className="text-slate-900 font-semibold">
                      {it.stockQty.toFixed(1)} {it.unit}
                    </TD>
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

      <Card>
        <CardHeader>
          <CardTitle>Product Catalog</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <THead>
              <tr>
                <TH>Product</TH>
                <TH>Category</TH>
                <TH>Price</TH>
                <TH>Status</TH>
                <TH>Action</TH>
              </tr>
            </THead>
            <TBody>
              {products.map((p) => (
                <tr key={p.id} className={!p.active ? 'opacity-60' : ''}>
                  <TD>
                    <div className="font-semibold text-slate-900">{p.name}</div>
                    <div className="text-xs text-slate-600">{p.sku}</div>
                  </TD>
                  <TD className="text-slate-700">{p.category}</TD>
                  <TD className="font-semibold">฿ {p.price.toFixed(2)}</TD>
                  <TD>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-800">
                      {p.active ? 'On shelf' : 'Hidden'}
                    </span>
                  </TD>
                  <TD>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => toggleProductActive(p.id, !p.active)}
                      >
                        {p.active ? 'Hide' : 'Unhide'}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => removeProduct(p.id)}>
                        Delete
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
