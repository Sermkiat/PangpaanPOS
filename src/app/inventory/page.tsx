"use client";

import { useEffect, useMemo, useState } from "react";
import { usePosStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TH, TD } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const formatDateTime = (value?: string) => {
  if (!value) return "";
  const dt = new Date(value);
  return dt.toLocaleString();
};

const emptyItem = {
  code: "",
  name: "",
  unit: "",
  stockQty: 0,
  costPerUnit: 0,
  reorderPoint: 0,
};

export default function InventoryPage() {
  const {
    items,
    products,
    inventoryMovements,
    adjustItemStock,
    addItem,
    updateItem,
    addProduct,
    toggleProductActive,
    removeProduct,
    fetchInventoryMovements,
    initFromApi,
  } = usePosStore();

  const [productStatus, setProductStatus] = useState<string>("");
  const [adjustments, setAdjustments] = useState<Record<number, number>>({});
  const [adjustNotes, setAdjustNotes] = useState<Record<number, string>>({});
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [itemForm, setItemForm] = useState(emptyItem);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [newProduct, setNewProduct] = useState({
    name: "",
    sku: "",
    category: "",
    price: 0,
    imageUrl: "",
    active: true,
    costPerUnit: 0,
    reorderPoint: 0,
    stockQty: 0,
  });
  const [itemPageSize, setItemPageSize] = useState(10);
  const [productPageSize, setProductPageSize] = useState(10);
  const [productEdits, setProductEdits] = useState<Record<number, Partial<typeof newProduct>>>({});

  useEffect(() => {
    fetchInventoryMovements();
  }, [fetchInventoryMovements]);

  const categories = useMemo(
    () => Array.from(new Set(items.map((i) => i.unit))).filter(Boolean),
    [items],
  );

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter((it) => {
      const matchTerm = !term || it.name.toLowerCase().includes(term) || it.code.toLowerCase().includes(term);
      const matchCategory = categoryFilter === "all" || it.unit === categoryFilter;
      return matchTerm && matchCategory;
    });
  }, [items, search, categoryFilter]);

  const applyAdjust = (id: number) => {
    const delta = adjustments[id];
    if (!delta) return;
    adjustItemStock(id, delta, adjustNotes[id]);
    setAdjustments((prev) => ({ ...prev, [id]: 0 }));
    setAdjustNotes((prev) => ({ ...prev, [id]: "" }));
  };

  const submitItem = async () => {
    if (!itemForm.code || !itemForm.name) return;
    if (editingItemId) {
      await updateItem(editingItemId, { ...itemForm });
    } else {
      await addItem({ ...itemForm });
    }
    setItemForm(emptyItem);
    setEditingItemId(null);
  };

  const startEditItem = (id: number) => {
    const target = items.find((it) => it.id === id);
    if (!target) return;
    setItemForm({
      code: target.code,
      name: target.name,
      unit: target.unit,
      stockQty: Number(target.stockQty ?? 0),
      costPerUnit: Number(target.costPerUnit ?? 0),
      reorderPoint: Number(target.reorderPoint ?? 0),
    });
    setEditingItemId(id);
  };

  const resetItemForm = () => {
    setItemForm(emptyItem);
    setEditingItemId(null);
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

  const submitProduct = async () => {
    if (!newProduct.name || !newProduct.category || newProduct.price <= 0) {
      setProductStatus('กรอกชื่อ / หมวด / ราคาให้ครบ');
      return;
    }
    const sku = newProduct.sku?.trim() || `SKU-${Date.now()}`;
    try {
      await addProduct({
        name: newProduct.name,
        sku,
        category: newProduct.category,
        price: newProduct.price,
        imageUrl: newProduct.imageUrl,
        active: newProduct.active,
      });
      setProductStatus('บันทึกสินค้าแล้ว');
      setNewProduct({ name: "", sku: "", category: "", price: 0, imageUrl: "", active: true, costPerUnit: 0, reorderPoint: 0, stockQty: 0 });
      await initFromApi();
    } catch (err: any) {
      setProductStatus('บันทึกไม่สำเร็จ: ' + (err?.message || err));
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-slate-600">Ingredients, supplies, and product catalog</p>
        <h1 className="text-2xl font-extrabold text-slate-900">Inventory & Products</h1>
      </div>

      <Card>
        <CardHeader className="space-y-1">
          <CardTitle>Stock Item (เพิ่ม/แก้ไข)</CardTitle>
          <p className="text-xs text-slate-600">รหัสสินค้า, หน่วย, ต้นทุน, สต็อก, จุดเตือนสต็อกต่ำ</p>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid gap-3 md:grid-cols-3">
            <Input
              placeholder="Code / SKU"
              value={itemForm.code}
              onChange={(e) => setItemForm((p) => ({ ...p, code: e.target.value }))}
            />
            <Input
              placeholder="ชื่อสินค้า"
              className="md:col-span-2"
              value={itemForm.name}
              onChange={(e) => setItemForm((p) => ({ ...p, name: e.target.value }))}
            />
            <Input
              placeholder="หน่วย (เช่น กก., ถุง, กล่อง)"
              value={itemForm.unit}
              onChange={(e) => setItemForm((p) => ({ ...p, unit: e.target.value }))}
            />
            <Input
              type="number"
              placeholder="ต้นทุนต่อหน่วย"
              value={itemForm.costPerUnit || ""}
              onChange={(e) => setItemForm((p) => ({ ...p, costPerUnit: Number(e.target.value) }))}
            />
            <Input
              type="number"
              placeholder="สต็อกเริ่มต้น"
              value={itemForm.stockQty || ""}
              onChange={(e) => setItemForm((p) => ({ ...p, stockQty: Number(e.target.value) }))}
            />
            <Input
              type="number"
              placeholder="จุดเตือนสต็อกต่ำ"
              value={itemForm.reorderPoint || ""}
              onChange={(e) => setItemForm((p) => ({ ...p, reorderPoint: Number(e.target.value) }))}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {editingItemId ? (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">กำลังแก้ไข #{editingItemId}</span>
            ) : null}
            <Button variant="primary" onClick={submitItem}>
              {editingItemId ? "Update Item" : "Save Item"}
            </Button>
            <Button variant="outline" onClick={resetItemForm}>
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Add / Update Product</CardTitle>
              <a href="/products/import" className="text-xs text-emerald-700 underline">CSV Import</a>
            </div>
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
                value={newProduct.price || ""}
                onChange={(e) => setNewProduct((p) => ({ ...p, price: Number(e.target.value) }))}
              />
              <Input
                placeholder="Image URL (optional)"
                className="col-span-2"
                value={newProduct.imageUrl}
                onChange={(e) => setNewProduct((p) => ({ ...p, imageUrl: e.target.value }))}
              />
              <div className="col-span-2 flex items-center gap-2 text-xs text-slate-600">
                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e.target.files?.[0] || null)} />
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
              {Array.from(new Set(products.map((p) => p.category))).map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
            {productStatus && <div className="text-xs text-emerald-700">{productStatus}</div>}
          </CardContent>
        </Card>

        <Card>
         <CardHeader className="space-y-2">
            <CardTitle>Stock & Adjustments</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Input
                placeholder="ค้นหาสินค้า / รหัส"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 min-w-[180px]"
              />
              <select
                className="rounded-md border px-3 py-2 text-sm text-slate-700"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">ทุกหน่วย</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <select
                className="rounded-md border px-3 py-2 text-sm text-slate-700"
                value={itemPageSize}
                onChange={(e) => setItemPageSize(Number(e.target.value))}
              >
                {[10, 20, 50].map((n) => (
                  <option key={n} value={n}>{n}/หน้า</option>
                ))}
              </select>
            </div>
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
                  <TH>Actions</TH>
                </tr>
              </THead>
              <TBody>
                {filteredItems.slice(0, itemPageSize).map((it) => (
                  <tr key={it.id} className={it.stockQty <= it.reorderPoint ? "bg-rose-50" : ""}>
                    <TD>
                      <div className="font-semibold text-slate-900">{it.name}</div>
                      <div className="text-xs text-slate-600">{it.code}</div>
                    </TD>
                    <TD className="text-slate-900 font-semibold">
                      {it.stockQty.toFixed(1)} {it.unit}
                    </TD>
                    <TD>฿ {it.costPerUnit.toFixed(3)}</TD>
                    <TD>
                      <div className="flex items-center gap-2">
                        <span>{it.reorderPoint.toFixed(0)}</span>
                        {it.stockQty <= it.reorderPoint ? (
                          <span className="rounded-full bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-700">Low</span>
                        ) : null}
                      </div>
                    </TD>
                    <TD>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            className="w-24"
                            value={adjustments[it.id] ?? ""}
                            placeholder="+/-"
                            onChange={(e) => setAdjustments((prev) => ({ ...prev, [it.id]: Number(e.target.value) }))}
                          />
                          <Button size="sm" variant="primary" onClick={() => applyAdjust(it.id)}>
                            Apply
                          </Button>
                        </div>
                        <Input
                          placeholder="เหตุผล / หมายเหตุ"
                          value={adjustNotes[it.id] ?? ""}
                          onChange={(e) => setAdjustNotes((prev) => ({ ...prev, [it.id]: e.target.value }))}
                        />
                      </div>
                    </TD>
                    <TD>
                      <Button size="sm" variant="secondary" onClick={() => startEditItem(it.id)}>
                        Edit
                      </Button>
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
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <CardTitle>Product Catalog</CardTitle>
              <div className="flex items-center gap-2 text-xs">
                {Array.from(new Set(products.map((p) => p.category))).map((cat) => {
                  const activeCount = products.filter((p) => p.category === cat && p.active).length;
                  const hiddenCount = products.filter((p) => p.category === cat && !p.active).length;
                  return (
                    <div key={cat} className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1">
                      <span className="font-semibold text-slate-700">{cat}</span>
                      <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[11px] font-bold text-white">On {activeCount}</span>
                      <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[11px] font-bold text-white">Hide {hiddenCount}</span>
                    </div>
                  );
                })}
                <select
                  className="rounded-md border px-2 py-1 text-xs text-slate-700"
                  value={productPageSize}
                  onChange={(e) => setProductPageSize(Number(e.target.value))}
                >
                  {[10, 20, 50].map((n) => (
                    <option key={n} value={n}>{n}/หน้า</option>
                  ))}
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <THead>
                <tr>
                <TH>Image</TH>
                <TH>Product</TH>
                <TH>Category</TH>
                <TH>Price</TH>
                <TH>Status</TH>
                <TH>Action</TH>
              </tr>
            </THead>
              <TBody>
                {products.slice(0, productPageSize).map((p) => {
                  const edits = productEdits[p.id] || {};
                  const nameVal = edits.name ?? p.name;
                  const catVal = edits.category ?? p.category;
                  const priceVal = edits.price ?? p.price;
                  const imageVal = edits.imageUrl ?? p.imageUrl ?? "";
                  const activeVal = edits.active ?? p.active;
                  return (
                    <tr key={p.id} className={!p.active ? "opacity-70" : ""}>
                      <TD>
                        <img src={imageVal || 'https://placehold.co/80x60'} alt={nameVal} className="h-12 w-16 rounded-md object-cover border" />
                        <Input
                          className="mt-1 w-36"
                          placeholder="Image URL"
                          value={imageVal}
                          onChange={(e) => setProductEdits((prev) => ({ ...prev, [p.id]: { ...prev[p.id], imageUrl: e.target.value } }))}
                        />
                      </TD>
                      <TD>
                        <Input
                          className="mb-1"
                          value={nameVal}
                          onChange={(e) => setProductEdits((prev) => ({ ...prev, [p.id]: { ...prev[p.id], name: e.target.value } }))}
                        />
                        <div className="text-xs text-slate-600">{p.sku}</div>
                      </TD>
                      <TD className="text-slate-700">
                        <Input
                          value={catVal}
                          onChange={(e) => setProductEdits((prev) => ({ ...prev, [p.id]: { ...prev[p.id], category: e.target.value } }))}
                        />
                      </TD>
                      <TD className="font-semibold">
                        <Input
                          type="number"
                          value={priceVal}
                          onChange={(e) => setProductEdits((prev) => ({ ...prev, [p.id]: { ...prev[p.id], price: Number(e.target.value) } }))}
                        />
                      </TD>
                      <TD>
                        <div className="flex flex-col gap-1">
                          <span className={`rounded-full px-2 py-1 text-xs font-semibold ${activeVal ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"}`}>
                            {activeVal ? "On shelf" : "Hide"}
                          </span>
                          <label className="flex items-center gap-1 text-xs text-slate-700">
                            <input
                              type="checkbox"
                              checked={activeVal}
                              onChange={(e) => setProductEdits((prev) => ({ ...prev, [p.id]: { ...prev[p.id], active: e.target.checked } }))}
                            />
                            แสดงบน POS
                          </label>
                        </div>
                      </TD>
                      <TD>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={async () => {
                              const payload = { ...p, ...productEdits[p.id] };
                              await updateProduct(p.id, {
                                name: payload.name,
                                category: payload.category,
                                price: payload.price,
                                imageUrl: payload.imageUrl,
                                active: payload.active,
                              });
                              setProductEdits((prev) => ({ ...prev, [p.id]: {} }));
                            }}
                          >
                            Save
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => toggleProductActive(p.id, !activeVal)}>
                            {activeVal ? "Hide" : "Unhide"}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => removeProduct(p.id)}>
                            Delete
                          </Button>
                        </div>
                      </TD>
                    </tr>
                  );
                })}
              </TBody>
            </Table>
          </CardContent>
        </Card>

      <Card>
        <CardHeader>
          <CardTitle>Movement Log</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <THead>
              <tr>
                <TH>เวลา</TH>
                <TH>สินค้า</TH>
                <TH>เปลี่ยน</TH>
                <TH>หมายเหตุ</TH>
              </tr>
            </THead>
            <TBody>
              {inventoryMovements.map((mv) => (
                <tr key={mv.id}>
                  <TD className="whitespace-nowrap text-xs text-slate-600">{formatDateTime(mv.createdAt)}</TD>
                  <TD>
                    <div className="font-semibold text-slate-900">{mv.name || "-"}</div>
                    <div className="text-xs text-slate-600">#{mv.productId}</div>
                  </TD>
                  <TD className={mv.change >= 0 ? "text-emerald-700 font-semibold" : "text-rose-700 font-semibold"}>
                    {mv.change >= 0 ? "+" : ""}
                    {mv.change}
                  </TD>
                  <TD className="text-slate-700">{mv.reason || "-"}</TD>
                </tr>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
