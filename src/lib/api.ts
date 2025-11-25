const defaultProxyBase = "/api/backend";

const browserBase = () => {
  if (process.env.NEXT_PUBLIC_API_BASE) return process.env.NEXT_PUBLIC_API_BASE;
  return defaultProxyBase;
};

const serverBase = () => process.env.INTERNAL_API_BASE || process.env.NEXT_PUBLIC_API_BASE || "http://api:8000";

const resolveBase = () => {
  if (typeof window === "undefined") return serverBase();
  return browserBase();
};

async function fetchJson<T>(path: string, options?: RequestInit): Promise<T> {
  const base = resolveBase();
  const target = path.startsWith("http") ? path : `${base}${path}`;
  const res = await fetch(target, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    cache: "no-store",
  });

  const raw = await res.text();
  if (!res.ok) {
    let message = `API ${path} ${res.status}`;
    try {
      const parsed = raw ? JSON.parse(raw) : null;
      if (parsed?.error) message = parsed.error;
      else if (parsed?.message) message = parsed.message;
    } catch (err) {
      // ignore JSON parse error
    }
    const error: any = new Error(message);
    error.status = res.status;
    error.body = raw;
    throw error;
  }

  const payload = raw ? JSON.parse(raw) : null;
  return (payload?.data ?? payload) as T;
}

export const api = {
  // Products
  getProducts: () => fetchJson<any[]>("/products"),
  createProduct: (body: any) => fetchJson<any>("/products", { method: "POST", body: JSON.stringify(body) }),
  updateProduct: (id: number, body: any) => fetchJson<any>(`/products/${id}`, { method: "PUT", body: JSON.stringify(body) }),

  // Recipes
  getRecipes: () => fetchJson<any[]>("/recipes"),
  getRecipe: (productId: number) => fetchJson<any>(`/recipes/${productId}`),
  saveRecipe: (productId: number, body: any) => fetchJson<any>(`/recipes/${productId}`, { method: "POST", body: JSON.stringify(body) }),

  // Inventory
  getItems: () => fetchJson<any[]>("/items"),
  createItem: (body: any) => fetchJson<any>("/items", { method: "POST", body: JSON.stringify(body) }),
  updateItem: (id: number, body: any) => fetchJson<any>(`/items/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  adjustItemStock: (id: number, delta: number, reason?: string) =>
    fetchJson<any>(`/items/${id}/adjust`, { method: "POST", body: JSON.stringify({ delta, reason }) }),
  importProducts: (csv: string) => fetchJson<any>("/products/import", { method: "POST", body: JSON.stringify({ csv }) }),
  getInventoryMovements: () => fetchJson<any[]>("/inventory/movements"),

  // Orders
  getOrders: () => fetchJson<any[]>("/orders"),
  createOrder: (body: any) => fetchJson<any>("/orders", { method: "POST", body: JSON.stringify(body) }),
  updateOrderStatus: (id: number, fulfillmentStatus: string) =>
    fetchJson<any>(`/orders/${id}/status`, { method: "PATCH", body: JSON.stringify({ fulfillmentStatus }) }),

  // Finance
  getExpenses: (month?: string) => fetchJson<any[]>(month ? `/expenses?month=${month}` : "/expenses"),
  getExpenseSummary: (month?: string) => fetchJson<{ total: number }>(month ? `/expenses/summary?month=${month}` : "/expenses/summary"),
  importExpenses: (csv: string, defaultPaymentMethod?: string) =>
    fetchJson<any>("/expenses/import", { method: "POST", body: JSON.stringify({ csv, defaultPaymentMethod }) }),
  createExpense: (body: any) => fetchJson<any>("/expenses", { method: "POST", body: JSON.stringify(body) }),

  getWaste: () => fetchJson<any[]>("/waste"),
  createWaste: (body: any) => fetchJson<any>("/waste", { method: "POST", body: JSON.stringify(body) }),

  getAllocation: () => fetchJson<any[]>("/allocation-rules"),
  createAllocation: (body: any) => fetchJson<any>("/allocation-rules", { method: "POST", body: JSON.stringify(body) }),
};

export default api;
