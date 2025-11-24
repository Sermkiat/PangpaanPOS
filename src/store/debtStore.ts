import { create } from "zustand";

export type Debt = {
  id: number;
  name: string;
  amount: number;
  dueDay: number;
  type: string;
  minimumPay?: number | null;
  totalDebt?: number | null;
  notes?: string | null;
};

export type DebtPayment = {
  id: number;
  debtId: number | null;
  name?: string | null;
  amount: number;
  paidAt: string;
};

export type ReserveSummary = {
  today: number;
  monthCollected: number;
  needThisMonth: number;
  remaining: number;
  nextDue: { name: string; date: number; need: number }[];
};

type DebtState = {
  debts: Debt[];
  payments: DebtPayment[];
  summary: ReserveSummary | null;
  reserveToday: number;
  loading: boolean;
  fetchDebts: () => Promise<void>;
  fetchPayments: () => Promise<void>;
  fetchSummary: () => Promise<void>;
  calculateToday: () => Promise<void>;
  addDebt: (payload: Omit<Debt, "id">) => Promise<void>;
  addPayment: (payload: { debtId: number; amount: number; paidAt?: string }) => Promise<void>;
};

const apiBase = "/api/backend";

async function fetchJson<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${apiBase}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`${path} ${res.status}`);
  const data = await res.json();
  return (data?.data ?? data) as T;
}

export const useDebtStore = create<DebtState>((set) => ({
  debts: [],
  payments: [],
  summary: null,
  reserveToday: 0,
  loading: false,

  fetchDebts: async () => {
    const debts = await fetchJson<Debt[]>("/debts");
    set({ debts });
  },

  fetchPayments: async () => {
    const payments = await fetchJson<DebtPayment[]>("/debts/payments");
    set({ payments });
  },

  fetchSummary: async () => {
    const summary = await fetchJson<ReserveSummary>("/debts/reserve-summary");
    set({ summary, reserveToday: summary.today });
  },

  calculateToday: async () => {
    const result = await fetchJson<{ income: number; reserve: number }>("/debts/reserve-today");
    set({ reserveToday: result.reserve });
  },

  addDebt: async (payload) => {
    await fetchJson("/debts", { method: "POST", body: JSON.stringify(payload) });
    await Promise.all([
      (async () => {
        const debts = await fetchJson<Debt[]>("/debts");
        set({ debts });
      })(),
      (async () => {
        const summary = await fetchJson<ReserveSummary>("/debts/reserve-summary");
        set({ summary });
      })(),
    ]);
  },

  addPayment: async (payload) => {
    await fetchJson("/debts/pay", { method: "POST", body: JSON.stringify(payload) });
    await Promise.all([useDebtStore.getState().fetchPayments(), useDebtStore.getState().fetchSummary()]);
  },
}));
