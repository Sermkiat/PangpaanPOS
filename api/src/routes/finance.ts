// @ts-nocheck
import { Router } from "express";
import { z } from "zod";
import { db } from "../db/client.js";
import { allocationRules, expenseLog, wasteRecords } from "../db/schema.js";
import { asyncHandler, ok } from "../utils/http.js";
import { eq } from "drizzle-orm";

const router = Router();

const expenseInput = z.object({
  category: z.string().min(1),
  description: z.string().min(1),
  amount: z.number().nonnegative(),
  incurredOn: z.coerce.date().optional(),
});

router.get(
  "/expenses",
  asyncHandler(async (_req, res) => {
    const rows = await db.query.expenseLog.findMany({
      orderBy: (tbl, { desc }) => desc(tbl.incurredOn),
    });
    return ok(res, rows);
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
