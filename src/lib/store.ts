import { create } from "zustand";
import api from "./api";

export type Item = {
  id: number;
  code: string;
  name: string;
  unit: string;
  stockQty: number;
  costPerUnit: number;
  reorderPoint: number;
};

export type InventoryMovement = {
  id: number;
  productId: number;
  change: number;
  reason?: string | null;
  createdAt: string;
  name?: string | null;
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

export type RecipeItem = { itemId: number; qty: number; itemName?: string; costPerUnit?: number };
export type Recipe = {
  id: number;
  productId: number;
  name: string;
  yieldQty: number;
  yieldUnit: string;
  items: RecipeItem[];
};

export type OrderLine = {
  productId: number;
  name?: string;
  qty: number;
  unitPrice: number;
  lineTotal?: number;
};

export type Order = {
  id: number;
  orderNumber: string;
  paymentStatus: "paid" | "unpaid";
  fulfillmentStatus: "waiting" | "finished";
  paymentMethod: "cash" | "promptpay" | "card";
  total: number;
  createdAt: string;
  paidAt?: string | null;
  servedAt?: string | null;
  items: OrderLine[];
};

export type Expense = { id: number; category: string; description: string; amount: number; date: string; paymentMethod?: string };
export type Waste = { id: number; itemId: number; qty: number; reason: string; date: string; name?: string; unit?: string };
export type AllocationRule = {
  id: number;
  name: string;
  ruleType: string;
  percentage: number;
  target: string;
  active: boolean;
};

const withNames = (orders: any[], products: Product[]): Order[] => {
  return orders.map((o) => ({
    ...o,
    paymentStatus: (o as any).paymentStatus || (o as any).status || "paid",
    fulfillmentStatus: (o as any).fulfillmentStatus || (o as any).status || "waiting",
    items: (o.items || []).map((line: any) => {
      const product = products.find((p) => p.id === line.productId);
      const unitPrice = Number(line.unitPrice ?? product?.price ?? 0);
      const qty = Number(line.qty ?? 0);
      return {
        ...line,
        qty,
        unitPrice,
        lineTotal: Number(line.lineTotal ?? unitPrice * qty),
        name: line.name || product?.name || `#${line.productId}`,
      } as OrderLine;
    }),
  }));
};

const enrichRecipes = (recipes: any[], items: Item[]): Recipe[] => {
  return recipes.map((r) => ({
    ...r,
    items: (r.items || []).map((it: any) => {
      const item = items.find((i) => i.id === it.itemId);
      return {
        itemId: it.itemId,
        qty: Number(it.qty ?? 0),
        itemName: it.itemName || item?.name,
        costPerUnit: it.costPerUnit ?? item?.costPerUnit ?? 0,
      } as RecipeItem;
    }),
  }));
};

type StoreState = {
  products: Product[];
  items: Item[];
  inventoryMovements: InventoryMovement[];
  recipes: Recipe[];
  orders: Order[];
  expenses: Expense[];
  waste: Waste[];
  allocationRules: AllocationRule[];
  loading: boolean;
  initFromApi: () => Promise<void>;
  addProduct: (p: Omit<Product, "id">) => Promise<Product>;
  updateProduct: (id: number, p: Partial<Omit<Product, "id">>) => Promise<void>;
  removeProduct: (id: number) => Promise<void>;
  toggleProductActive: (id: number, active: boolean) => Promise<void>;
  addOrder: (lines: OrderLine[], paymentMethod: Order["paymentMethod"], paymentStatus: Order["paymentStatus"], fulfillmentStatus: Order["fulfillmentStatus"]) => Promise<Order>;
  updateOrderStatus: (id: number, fulfillmentStatus: Order["fulfillmentStatus"]) => Promise<void>;
  adjustItemStock: (itemId: number, delta: number, reason?: string) => Promise<void>;
  addItem: (payload: Omit<Item, "id">) => Promise<void>;
  updateItem: (id: number, payload: Partial<Omit<Item, "id">>) => Promise<void>;
  fetchInventoryMovements: () => Promise<void>;
  fetchExpenses: (month?: string) => Promise<void>;
  addExpense: (e: Omit<Expense, "id" | "date"> & { date?: string }) => Promise<void>;
  addWaste: (w: Omit<Waste, "id" | "date"> & { date?: string }) => Promise<void>;
  addAllocationRule: (rule: Omit<AllocationRule, "id">) => Promise<void>;
  saveRecipe: (productId: number, payload: Partial<Recipe> & { items: RecipeItem[] }) => Promise<void>;
  fetchRecipes: () => Promise<void>;
};

export const usePosStore = create<StoreState>()((set, get) => ({
  products: [],
  items: [],
  inventoryMovements: [],
  recipes: [],
  orders: [],
  expenses: [],
  waste: [],
  allocationRules: [],
  loading: false,

  initFromApi: async () => {
    set({ loading: true });
    try {
      const [products, items, recipes, orders, expenses, waste, allocationRules, inventoryMovements] = await Promise.all([
        api.getProducts(),
        api.getItems(),
        api.getRecipes(),
        api.getOrders(),
        api.getExpenses(),
        api.getWaste(),
        api.getAllocation(),
        api.getInventoryMovements ? api.getInventoryMovements() : [],
      ]);

      set({
        products,
        items,
        inventoryMovements,
        recipes: enrichRecipes(recipes, items),
        orders: withNames(orders, products),
        expenses: expenses.map((e: any) => ({
          id: e.id,
          category: e.category,
          description: e.description,
          amount: Number(e.amount ?? 0),
          date: e.date || e.incurredOn || new Date().toISOString(),
          paymentMethod: e.paymentMethod,
        })),
        waste: waste.map((w: any) => ({
          id: w.id,
          itemId: w.itemId,
          qty: Number(w.qty ?? 0),
          reason: w.reason,
          date: w.date || w.recordedOn || new Date().toISOString(),
          name: w.name,
          unit: w.unit,
        })),
        allocationRules,
        loading: false,
      });
    } catch (err) {
      console.error("initFromApi failed", err);
      set({ loading: false });
    }
  },

  addProduct: async (p) => {
    const created = await api.createProduct(p);
    set((state) => ({ products: [...state.products, created] }));
    return created;
  },

  updateProduct: async (id, p) => {
    const updated = await api.updateProduct(id, p);
    set((state) => ({ products: state.products.map((prod) => (prod.id === id ? { ...prod, ...updated } : prod)) }));
  },

  removeProduct: async (id) => {
    // Soft delete: mark inactive
    const updated = await api.updateProduct(id, { active: false });
    set((state) => ({ products: state.products.map((prod) => (prod.id === id ? { ...prod, ...updated, active: false } : prod)) }));
  },

  toggleProductActive: async (id, active) => {
    const updated = await api.updateProduct(id, { active });
    set((state) => ({ products: state.products.map((prod) => (prod.id === id ? { ...prod, ...updated, active } : prod)) }));
  },

  addOrder: async (lines, paymentMethod, paymentStatus, fulfillmentStatus) => {
    const payload = {
      paymentMethod,
      paymentStatus,
      fulfillmentStatus,
      items: lines.map((l) => ({ productId: l.productId, qty: l.qty })),
    };
    const created = await api.createOrder(payload);
    const orderWithNames = withNames([created], get().products)[0];
    set((state) => ({ orders: [orderWithNames, ...state.orders] }));
    return orderWithNames;
  },

  updateOrderStatus: async (id, fulfillmentStatus) => {
    const updated = await api.updateOrderStatus(id, fulfillmentStatus);
    set((state) => ({ orders: state.orders.map((o) => (o.id === id ? { ...o, ...updated, fulfillmentStatus } : o)) }));
  },

  adjustItemStock: async (itemId, delta, reason) => {
    const updated = await api.adjustItemStock(itemId, delta, reason);
    set((state) => ({ items: state.items.map((it) => (it.id === itemId ? { ...it, ...updated } : it)) }));
    try {
      const movements = api.getInventoryMovements ? await api.getInventoryMovements() : [];
      set({ inventoryMovements: movements });
    } catch (err) {
      console.warn("load movements failed", err);
    }
  },

  addItem: async (payload) => {
    const created = await api.createItem(payload);
    set((state) => ({ items: [...state.items, created] }));
  },

  updateItem: async (id, payload) => {
    const updated = await api.updateItem(id, payload);
    set((state) => ({ items: state.items.map((it) => (it.id === id ? { ...it, ...updated } : it)) }));
  },

  fetchInventoryMovements: async () => {
    if (!api.getInventoryMovements) return;
    const rows = await api.getInventoryMovements();
    set({ inventoryMovements: rows });
  },

  fetchExpenses: async (month) => {
    const rows = await api.getExpenses(month);
    set({
      expenses: rows.map((e: any) => ({
        id: e.id,
        category: e.category,
        description: e.description,
        amount: Number(e.amount ?? 0),
        date: e.date || e.incurredOn || new Date().toISOString(),
        paymentMethod: e.paymentMethod,
      })),
    });
  },

  addExpense: async (e) => {
    const created = await api.createExpense({ ...e, incurredOn: e.date });
    const mapped: Expense = {
      id: created.id,
      category: created.category,
      description: created.description,
      amount: Number(created.amount ?? e.amount),
      date: created.date || created.incurredOn || e.date || new Date().toISOString(),
      paymentMethod: created.paymentMethod || e.paymentMethod,
    };
    set((state) => ({ expenses: [mapped, ...state.expenses] }));
  },

  addWaste: async (w) => {
    const created = await api.createWaste({ ...w, recordedOn: w.date });
    const mapped: Waste = {
      id: created.id,
      itemId: created.itemId,
      qty: Number(created.qty ?? w.qty),
      reason: created.reason,
      date: created.date || created.recordedOn || w.date || new Date().toISOString(),
      name: created.name,
      unit: created.unit,
    };
    set((state) => ({
      waste: [mapped, ...state.waste],
      items: created.updatedItem
        ? state.items.map((it) => (it.id === created.updatedItem.id ? { ...it, ...created.updatedItem } : it))
        : state.items,
    }));
  },

  addAllocationRule: async (rule) => {
    const created = await api.createAllocation(rule);
    set((state) => ({ allocationRules: [created, ...state.allocationRules] }));
  },

  saveRecipe: async (productId, payload) => {
    const saved = await api.saveRecipe(productId, payload);
    const currentItems = get().items;
    const recipe = enrichRecipes([saved], currentItems)[0];
    set((state) => ({
      recipes: state.recipes.filter((r) => r.productId !== productId).concat(recipe),
    }));
  },

  fetchRecipes: async () => {
    const recipes = await api.getRecipes();
    const items = get().items;
    set({ recipes: enrichRecipes(recipes, items) });
  },
}));
