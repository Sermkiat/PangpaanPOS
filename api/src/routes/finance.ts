// @ts-nocheck
import { Router } from "express";
import { z } from "zod";
import { db } from "../db/client.js";
import { allocationRules, expenseLog, wasteRecords } from "../db/schema.js";
import { asyncHandler, ok } from "../utils/http.js";
import { eq, sql } from "drizzle-orm";

const router = Router();

const expenseInput = z.object({
  category: z.string().min(1),
  description: z.string().min(1),
  amount: z.number().nonnegative(),
  paymentMethod: z.string().optional(),
  incurredOn: z.coerce.date().optional(),
});

router.get(
  "/expenses",
  asyncHandler(async (req, res) => {
    const month = (req.query.month as string | undefined)?.trim();
    const filters: any[] = [];
    if (month && /^\d{4}-\d{2}$/.test(month)) {
      filters.push(sql`to_char(${expenseLog.incurredOn}, YYYY-MM) = ${month}`);
    }

    const rows = await db.query.expenseLog.findMany({
      where: filters.length ? sql`${sql.join(filters, sql` and `)}` : undefined,
      orderBy: (tbl, { desc }) => desc(tbl.incurredOn),
    });
    return ok(res, rows);
  }),
);

router.get(
  "/expenses/summary",
  asyncHandler(async (req, res) => {
    const month = (req.query.month as string | undefined)?.trim();
    const filters: any[] = [];
    if (month && /^\d{4}-\d{2}$/.test(month)) {
      filters.push(sql`to_char(${expenseLog.incurredOn}, YYYY-MM) = ${month}`);
    }
    const [row] = await db
      .select({ total: sql<number>`coalesce(sum(${expenseLog.amount}), 0)` })
      .from(expenseLog)
      .where(filters.length ? sql`${sql.join(filters, sql` and `)}` : undefined);
    return ok(res, row ?? { total: 0 });
  }),
);

router.post(
  "/expenses/import",
  asyncHandler(async (req, res) => {
    const { csv, defaultPaymentMethod } = z
      .object({ csv: z.string().min(1), defaultPaymentMethod: z.string().optional() })
      .parse(req.body);

    const lines = csv
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length < 2) return res.status(400).json({ success: false, error: "No rows to import" });

    const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const idx = (key: string) => header.indexOf(key);
    const dateIdx = idx("date");
    const categoryIdx = idx("category");
    const detailIdx = idx("detail");
    const descIdx = idx("description");
    const amountIdx = idx("amount");
    const payIdx = idx("payment_method");

    const rowsToInsert: any[] = [];
    for (const line of lines.slice(1)) {
      const cols = line.split(",");
      const amount = Number((cols[amountIdx] ?? "").trim());
      if (!amount || Number.isNaN(amount)) continue;
      const dateStr = (cols[dateIdx] ?? "").trim();
      const incurredOn = dateStr ? new Date(dateStr) : new Date();
      const category = (cols[categoryIdx] ?? "").trim() || "other";
      const description = (cols[detailIdx] ?? cols[descIdx] ?? "").trim() || "imported";
      const paymentMethod = (cols[payIdx] ?? "").trim() || defaultPaymentMethod || undefined;
      rowsToInsert.push({ category, description, amount, incurredOn, paymentMethod });
    }

    if (!rowsToInsert.length) return res.status(400).json({ success: false, error: "No valid rows" });
    const inserted = await db.insert(expenseLog).values(rowsToInsert).returning();
    return ok(res, { inserted: inserted.length, rows: inserted });
  }),
);

router.post(
  "/expenses",
  asyncHandler(async (req, res) => {
    const payload = expenseInput.parse(req.body);
    const [created] = await db
      .insert(expenseLog)
      .values({ ...payload, incurredOn: payload.incurredOn ?? new Date() })
      .returning();
    return ok(res, created, 201);
  }),
);

const wasteInput = z.object({
  itemId: z.number().int().positive(),
  qty: z.number().positive(),
  reason: z.string().min(1),
  recordedOn: z.coerce.date().optional(),
});

router.get(
  "/waste",
  asyncHandler(async (_req, res) => {
    const rows = await db.query.wasteRecords.findMany({
      orderBy: (tbl, { desc }) => desc(tbl.recordedOn),
    });
    return ok(res, rows);
  }),
);

router.post(
  "/waste",
  asyncHandler(async (req, res) => {
    const payload = wasteInput.parse(req.body);
    const [created] = await db
      .insert(wasteRecords)
      .values({ ...payload, recordedOn: payload.recordedOn ?? new Date() })
      .returning();
    return ok(res, created, 201);
  }),
);

const allocationInput = z.object({
  name: z.string().min(1),
  ruleType: z.string().min(1),
  percentage: z.number().min(0).max(100),
  target: z.string().min(1),
  active: z.boolean().optional(),
});

router.get(
  "/allocation-rules",
  asyncHandler(async (_req, res) => {
    const rows = await db.query.allocationRules.findMany();
    return ok(res, rows);
  }),
);

router.post(
  "/allocation-rules",
  asyncHandler(async (req, res) => {
    const payload = allocationInput.parse(req.body);
    const [created] = await db
      .insert(allocationRules)
      .values({ ...payload, active: payload.active ?? true })
      .returning();
    return ok(res, created, 201);
  }),
);

router.put(
  "/allocation-rules/:id",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const payload = allocationInput.partial().parse(req.body);
    const [updated] = await db
      .update(allocationRules)
      .set({ ...payload, updatedAt: new Date() })
      .where(eq(allocationRules.id, id))
      .returning();
    if (!updated) return res.status(404).json({ success: false, error: "Rule not found" });
    return ok(res, updated);
  }),
);

export default router;
