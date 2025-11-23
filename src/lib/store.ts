import { create } from "zustand";
import { nanoid } from "nanoid";

export type Item = {
  id: number;
  code: string;
  name: string;
  unit: string;
  stockQty: number;
  costPerUnit: number;
  reorderPoint: number;
};

export type Product = {
  id: number;
  sku: string;
  name: string;
  category: string;
  price: number;
  imageUrl?: string;
  active: boolean;
};

export type RecipeItem = { itemId: number; qty: number; itemName: string; costPerUnit: number };

export type Recipe = {
  id: number;
  productId: number;
  name: string;
  yieldQty: number;
  yieldUnit: string;
  items: RecipeItem[];
};

export type OrderLine = { productId: number; name: string; qty: number; unitPrice: number };
export type Order = {
  id: string;
  orderNumber: string;
  status: "pending" | "prepping" | "ready" | "served";
  paymentMethod: "cash" | "promptpay" | "card";
  total: number;
  createdAt: string;
  items: OrderLine[];
};

export type Expense = { id: string; category: string; description: string; amount: number; date: string };
export type Waste = { id: string; itemId: number; qty: number; reason: string; date: string };
export type AllocationRule = {
  id: string;
  name: string;
  ruleType: string;
  percentage: number;
  target: string;
  active: boolean;
};

type StoreState = {
  products: Product[];
  items: Item[];
  recipes: Recipe[];
  orders: Order[];
  expenses: Expense[];
  waste: Waste[];
  allocationRules: AllocationRule[];
  addProduct: (p: Omit<Product, "id">) => Product;
  updateProduct: (id: number, p: Partial<Omit<Product, "id">>) => void;
  removeProduct: (id: number) => void;
  toggleProductActive: (id: number, active: boolean) => void;
  addOrder: (lines: OrderLine[], paymentMethod: Order["paymentMethod"]) => Order;
  updateOrderStatus: (id: string, status: Order["status"]) => void;
  adjustItemStock: (itemId: number, delta: number) => void;
  addExpense: (e: Omit<Expense, "id" | "date"> & { date?: string }) => void;
  addWaste: (w: Omit<Waste, "id" | "date"> & { date?: string }) => void;
  addAllocationRule: (rule: Omit<AllocationRule, "id">) => void;
};

const sampleItems: Item[] = [
  { id: 1, code: "MILK-1L", name: "Fresh Milk 1L", unit: "ml", stockQty: 5200, costPerUnit: 0.055, reorderPoint: 2000 },
  { id: 2, code: "FLOUR-AP", name: "Flour AP", unit: "g", stockQty: 12000, costPerUnit: 0.02, reorderPoint: 4000 },
  { id: 3, code: "SUGAR", name: "Sugar", unit: "g", stockQty: 5600, costPerUnit: 0.018, reorderPoint: 3000 },
  { id: 4, code: "BUTTER", name: "Butter", unit: "g", stockQty: 2600, costPerUnit: 0.09, reorderPoint: 1200 },
];

const sampleProducts: Product[] = [
  {
    id: 1,
    sku: "LATTE-ICED",
    name: "Iced Latte",
    category: "Coffee",
    price: 75,
    imageUrl: "https://images.unsplash.com/photo-1510626176961-4b37d0f0b4fd?auto=format&w=800&q=60",
    active: true,
  },
  {
    id: 2,
    sku: "CARAMEL",
    name: "Caramel Macchiato",
    category: "Coffee",
    price: 95,
    imageUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&w=800&q=60",
    active: true,
  },
  {
    id: 3,
    sku: "STRAW-CAKE",
    name: "Strawberry Shortcake",
    category: "Bakery",
    price: 145,
    imageUrl: "https://images.unsplash.com/photo-1505253758473-96b7015fcd40?auto=format&w=800&q=60",
    active: true,
  },
];

const sampleRecipes: Recipe[] = [
  {
    id: 1,
    productId: 1,
    name: "Iced Latte Base",
    yieldQty: 1,
    yieldUnit: "cup",
    items: [
      { itemId: 1, qty: 250, itemName: "Fresh Milk 1L", costPerUnit: 0.055 },
      { itemId: 3, qty: 6, itemName: "Sugar", costPerUnit: 0.018 },
    ],
  },
  {
    id: 2,
    productId: 3,
    name: "Strawberry Shortcake",
    yieldQty: 1,
    yieldUnit: "slice",
    items: [
      { itemId: 2, qty: 120, itemName: "Flour AP", costPerUnit: 0.02 },
      { itemId: 4, qty: 40, itemName: "Butter", costPerUnit: 0.09 },
      { itemId: 3, qty: 35, itemName: "Sugar", costPerUnit: 0.018 },
    ],
  },
];

const seedOrders: Order[] = [
  {
    id: "ord-1",
    orderNumber: "PP-20241101-0001",
    status: "prepping",
    paymentMethod: "promptpay",
    total: 240,
    createdAt: new Date().toISOString(),
    items: [
      { productId: 1, name: "Iced Latte", qty: 2, unitPrice: 75 },
      { productId: 3, name: "Strawberry Shortcake", qty: 1, unitPrice: 145 },
    ],
  },
];

const seedExpenses: Expense[] = [
  { id: "exp-1", category: "Utilities", description: "Electricity (Oct)", amount: 3200, date: new Date().toISOString() },
  { id: "exp-2", category: "Supplies", description: "Coffee beans order", amount: 4500, date: new Date().toISOString() },
];

const seedWaste: Waste[] = [
  { id: "w1", itemId: 1, qty: 1, reason: "Spilled milk", date: new Date().toISOString() },
];

const seedAllocations: AllocationRule[] = [
  { id: "ar1", name: "COGS", ruleType: "percentage", percentage: 35, target: "Sales", active: true },
  { id: "ar2", name: "Marketing Fund", ruleType: "percentage", percentage: 5, target: "Sales", active: true },
];

export const usePosStore = create<StoreState>((set, get) => ({
  products: sampleProducts,
  items: sampleItems,
  recipes: sampleRecipes,
  orders: seedOrders,
  expenses: seedExpenses,
  waste: seedWaste,
  allocationRules: seedAllocations,
  addProduct: (p) => {
    const next: Product = { ...p, id: Date.now() };
    set((state) => ({ products: [...state.products, next] }));
    return next;
  },
  updateProduct: (id, p) =>
    set((state) => ({
      products: state.products.map((prod) => (prod.id === id ? { ...prod, ...p } : prod)),
    })),
  removeProduct: (id) =>
    set((state) => ({
      products: state.products.filter((prod) => prod.id !== id),
      recipes: state.recipes.filter((r) => r.productId !== id),
    })),
  toggleProductActive: (id, active) =>
    set((state) => ({
      products: state.products.map((prod) => (prod.id === id ? { ...prod, active } : prod)),
    })),
  addOrder: (lines, paymentMethod) => {
    const total = lines.reduce((sum, l) => sum + l.qty * l.unitPrice, 0);
    const order: Order = {
      id: nanoid(),
      orderNumber: `PP-${new Date().toISOString().replace(/[-:T]/g, "").slice(0, 12)}`,
      status: "pending",
      paymentMethod,
      total,
      createdAt: new Date().toISOString(),
      items: lines,
    };
    set((state) => ({ orders: [order, ...state.orders] }));
    return order;
  },
  updateOrderStatus: (id, status) =>
    set((state) => ({
      orders: state.orders.map((o) => (o.id === id ? { ...o, status } : o)),
    })),
  adjustItemStock: (itemId, delta) =>
    set((state) => ({
      items: state.items.map((it) => (it.id === itemId ? { ...it, stockQty: it.stockQty + delta } : it)),
    })),
  addExpense: (e) =>
    set((state) => ({
      expenses: [
        { id: nanoid(), category: e.category, description: e.description, amount: e.amount, date: e.date ?? new Date().toISOString() },
        ...state.expenses,
      ],
    })),
  addWaste: (w) =>
    set((state) => ({
      waste: [
        { id: nanoid(), itemId: w.itemId, qty: w.qty, reason: w.reason, date: w.date ?? new Date().toISOString() },
        ...state.waste,
      ],
    })),
  addAllocationRule: (rule) =>
    set((state) => ({
      allocationRules: [{ id: nanoid(), ...rule }, ...state.allocationRules],
    })),
}));
