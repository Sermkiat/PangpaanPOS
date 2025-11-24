'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { usePosStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Star } from 'lucide-react';

interface CartLine {
  productId: number;
  qty: number;
}

export default function PosPage() {
  const { products, addOrder } = usePosStore();
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [payment, setPayment] = useState<'cash' | 'promptpay'>('cash');
  const [cashValue, setCashValue] = useState<string>('');
  const [showConfirm, setShowConfirm] = useState<boolean>(false);
  const [cartToast, setCartToast] = useState<number>(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = window.localStorage.getItem('pp-pos-favorites');
    if (saved) {
      try {
        setFavoriteIds(JSON.parse(saved));
      } catch {
        setFavoriteIds([]);
      }
    }
  }, []);

  const persistFavorites = (next: number[]) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('pp-pos-favorites', JSON.stringify(next));
    }
  };

  const toggleFavorite = (id: number) => {
    setFavoriteIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      persistFavorites(next);
      return next;
    });
  };

  const isFavorite = (id: number) => favoriteIds.includes(id);

  const categories = ['All', ...new Set(products.map((p) => p.category))];
  const searchTerm = search.trim().toLowerCase();
  const filtered = products
    .filter((p) => activeCategory === 'All' || p.category === activeCategory)
    .filter((p) => {
      if (!searchTerm) return true;
      const name = p.name.toLowerCase();
      const sku = p.sku.toLowerCase();
      const category = p.category.toLowerCase();
      return name.includes(searchTerm) || sku.includes(searchTerm) || category.includes(searchTerm);
    });

  const orderedProducts = useMemo(() => {
    return [...filtered].sort((a, b) => Number(isFavorite(b.id)) - Number(isFavorite(a.id)));
  }, [filtered, favoriteIds]);

  const totals = useMemo(() => {
    const enriched = cart.map((c) => {
      const product = products.find((p) => p.id === c.productId);
      const unitPrice = product?.price ?? 0;
      return { ...c, unitPrice, lineTotal: unitPrice * c.qty, name: product?.name ?? '' };
    });
    const subtotal = enriched.reduce((sum, l) => sum + l.lineTotal, 0);
    const discountAmt = (subtotal * discount) / 100;
    const total = Math.max(0, subtotal - discountAmt);
    return { enriched, subtotal, discountAmt, total };
  }, [cart, products, discount]);

  const addToCart = (productId: number) => {
    setCart((prev) => {
      const found = prev.find((c) => c.productId === productId);
      if (found) return prev.map((c) => (c.productId === productId ? { ...c, qty: c.qty + 1 } : c));
      return [...prev, { productId, qty: 1 }];
    });
    setCartToast((c) => c + 1);
  };

  const updateQty = (productId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => (c.productId === productId ? { ...c, qty: Math.max(1, c.qty + delta) } : c))
        .filter((c) => c.qty > 0),
    );
  };

  const removeLine = (productId: number) => {
    setCart((prev) => prev.filter((c) => c.productId !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setCashValue('');
    setDiscount(0);
  };

  const cashNumber = Number(cashValue) || 0;
  const change = Math.max(0, cashNumber - totals.total);

  const bumpCash = (amount: number) => {
    setCashValue((prev) => {
      const current = Number(prev) || 0;
      return (current + amount).toFixed(2);
    });
  };

  const setCashExact = (amount: number) => {
    setCashValue(amount.toFixed(2));
  };

  const handlePay = () => {
    if (totals.enriched.length === 0) return;
    setShowConfirm(true);
  };

  const confirmPay = () => {
    const lines = totals.enriched.map((line) => ({
      productId: line.productId,
      name: line.name,
      qty: line.qty,
      unitPrice: line.unitPrice,
    }));
    addOrder(lines, payment);
    setShowConfirm(false);
    clearCart();
  };

  useEffect(() => {
    if (cartToast > 0) {
      const t = setTimeout(() => setCartToast(0), 1500);
      return () => clearTimeout(t);
    }
  }, [cartToast]);

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <div className="lg:col-span-3 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Categories</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={cat === activeCategory ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </Button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>POS Screen</CardTitle>
            <Input
              placeholder="ค้นหาสินค้า..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-72"
            />
          </CardHeader>
          <CardContent className="grid gap-3 grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
            {orderedProducts.map((p) => (
              <button
                key={p.id}
                onClick={() => addToCart(p.id)}
                className="relative group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="absolute right-2 top-2 z-10">
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(p.id);
                    }}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); toggleFavorite(p.id); } }}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-slate-700 shadow hover:bg-white"
                  >
                    <Star
                      size={18}
                      className={isFavorite(p.id) ? 'text-amber-500 fill-amber-400' : 'text-slate-500'}
                    />
                  </span>
                </div>
                <div className="relative h-36 w-full overflow-hidden bg-slate-50">
                  <Image
                    src={p.imageUrl || 'https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&w=800&q=60'}
                    alt={p.name}
                    fill
                    className="object-cover transition group-hover:scale-105"
                  />
                </div>
                <div className="space-y-1 p-3">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span>{p.category}</span>
                    {p.active ? <Badge tone="green">On shelf</Badge> : <Badge tone="gray">Hidden</Badge>}
                  </div>
                  <div className="font-semibold text-slate-900 leading-tight">{p.name}</div>
                  <div className="text-lg font-extrabold text-slate-900">฿ {p.price.toFixed(0)}</div>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2 space-y-4 lg:max-h-[calc(100vh-180px)] lg:overflow-auto pb-4">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Order Details</CardTitle>
            <Button variant="outline" size="sm" onClick={clearCart}>
              Clear
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {totals.enriched.length === 0 && <p className="text-sm text-slate-600">No items yet</p>}
            {totals.enriched.map((line) => (
              <div
                key={line.productId}
                className="rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-md bg-slate-900 px-2 py-1 text-xs font-semibold text-white">
                      {line.qty}x
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 leading-tight">{line.name}</div>
                      <button
                        className="mt-1 text-sm font-semibold text-rose-600 underline"
                        onClick={() => removeLine(line.productId)}
                        type="button"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <div className="text-right text-base font-semibold text-slate-900">
                    ฿ {line.lineTotal.toFixed(2)}
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    className="h-10 w-10 rounded-lg border border-slate-200 text-lg font-semibold text-slate-800 hover:bg-slate-50"
                    onClick={() => updateQty(line.productId, -1)}
                    type="button"
                  >
                    –
                  </button>
                  <span className="min-w-[2.5rem] text-center text-base font-semibold text-slate-900">
                    {line.qty}
                  </span>
                  <button
                    className="h-10 w-10 rounded-lg border border-slate-200 text-lg font-semibold text-slate-800 hover:bg-slate-50"
                    onClick={() => updateQty(line.productId, 1)}
                    type="button"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 pt-6 text-slate-900 relative">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Subtotal</span>
              <span className="font-semibold">฿ {totals.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-slate-600">Discount</span>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  className="w-20 text-center"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                />
                <span className="text-slate-600">%</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm text-slate-700">
              <span>Discount</span>
              <span>-{totals.discountAmt.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-xl font-extrabold">
              <span>Total</span>
              <span>฿ {totals.total.toFixed(2)}</span>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-semibold text-slate-800">Payment Method</div>
              <div className="flex gap-4 text-sm text-slate-700">
                {(['cash', 'promptpay'] as const).map((method) => (
                  <label key={method} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="payment"
                      value={method}
                      checked={payment === method}
                      onChange={() => setPayment(method)}
                      className="h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="capitalize">{method}</span>
                  </label>
                ))}
              </div>
              {payment === 'promptpay' && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
                  <div className="text-sm font-semibold text-slate-800 mb-2">PromptPay QR</div>
                  <img
                    src="https://promptpay.io/0868938788.png"
                    alt="PromptPay QR"
                    className="mx-auto h-32 w-32 object-contain"
                  />
                  <div className="mt-2 text-sm font-bold text-slate-900">฿ {totals.total.toFixed(2)}</div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="text-sm font-semibold text-slate-800">เงินรับมา</div>
              <Input
                type="number"
                inputMode="decimal"
                className="h-12 text-right text-lg"
                value={cashValue}
                onChange={(e) => setCashValue(e.target.value)}
                placeholder="0.00"
                disabled={payment !== 'cash'}
              />
              <div className="grid grid-cols-4 gap-2">
                {[1, 5, 10, 20, 50, 100, 500, 1000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => bumpCash(amt)}
                    className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-200"
                    disabled={payment !== 'cash'}
                  >
                    +{amt}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setCashExact(totals.total)}
                  className="col-span-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                  disabled={payment !== 'cash'}
                >
                  Exact
                </button>
                <button
                  type="button"
                  onClick={() => setCashValue('')}
                  className="col-span-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                  disabled={payment !== 'cash'}
                >
                  Clear Cash
                </button>
              </div>
            </div>

              <div className="flex items-center justify-between text-base font-semibold text-slate-900">
                <span>เงินทอน</span>
                <span>฿ {change.toFixed(2)}</span>
              </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={clearCart}
                className="flex-1 rounded-xl border border-slate-200 bg-white py-3 text-base font-semibold text-slate-800 hover:bg-slate-50"
              >
                Clear
              </button>
              <button
                type="button"
                disabled={totals.total === 0}
                onClick={handlePay}
                className="flex-1 rounded-xl bg-emerald-500 py-3 text-base font-bold text-white shadow hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Pay ฿ {totals.total.toFixed(2)}
              </button>
            </div>

            {cartToast > 0 && (
              <div className="absolute -top-4 right-4 rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-emerald-950 shadow">
                {cart.reduce((s, l) => s + l.qty, 0)} items
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-slate-900">สรุปรายการ</h3>
              <button onClick={() => setShowConfirm(false)} className="text-slate-500 hover:text-slate-800 text-sm">Close</button>
            </div>
            <div className="space-y-2 max-h-60 overflow-auto">
              {totals.enriched.map((line) => (
                <div key={line.productId} className="flex justify-between text-sm text-slate-800">
                  <span>{line.qty} × {line.name}</span>
                  <span>฿ {line.lineTotal.toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 border-t border-slate-200 pt-3 space-y-1 text-sm text-slate-800">
              <div className="flex justify-between"><span>Subtotal</span><span>฿ {totals.subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Discount</span><span>-฿ {totals.discountAmt.toFixed(2)}</span></div>
              <div className="flex justify-between font-bold text-slate-900"><span>Total</span><span>฿ {totals.total.toFixed(2)}</span></div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowConfirm(false)}>ยกเลิก</Button>
              <Button className="flex-1" onClick={confirmPay}>ยืนยันชำระ</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
