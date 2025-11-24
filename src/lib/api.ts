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
  if (!res.ok) throw new Error(`API ${path} ${res.status}`);
  const payload = await res.json();
  return (payload?.data ?? payload) as T;
}

export const api = {
  // Products
  getProducts: () => fetchJson<any[]>("/products"),
  createProduct: (body: any) => fetchJson<any>("/products", { method: "POST", body: JSON.stringify(body) }),
  updateProduct: (id: number, body: any) => fetchJson<any>(`/products/${id}`, { method: "PUT", body: JSON.stringify(body) }),

  // Recipes
  getRecipes: () => fetchJson<any[]>("/recipes"),

  // Inventory
  getItems: () => fetchJson<any[]>("/items"),
  adjustItemStock: (id: number, delta: number, reason?: string) =>
    fetchJson<any>(`/items/${id}/adjust`, { method: "POST", body: JSON.stringify({ delta, reason }) }),
  getInventoryMovements: () => fetchJson<any[]>("/inventory/movements"),

  // Orders
  getOrders: () => fetchJson<any[]>("/orders"),
  createOrder: (body: any) => fetchJson<any>("/orders", { method: "POST", body: JSON.stringify(body) }),
  updateOrderStatus: (id: number, status: string) =>
    fetchJson<any>(`/orders/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),

  // Finance
  getExpenses: () => fetchJson<any[]>("/expenses"),
  createExpense: (body: any) => fetchJson<any>("/expenses", { method: "POST", body: JSON.stringify(body) }),

  getWaste: () => fetchJson<any[]>("/waste"),
  createWaste: (body: any) => fetchJson<any>("/waste", { method: "POST", body: JSON.stringify(body) }),

  getAllocation: () => fetchJson<any[]>("/allocation-rules"),
  createAllocation: (body: any) => fetchJson<any>("/allocation-rules", { method: "POST", body: JSON.stringify(body) }),
};

export default api;
