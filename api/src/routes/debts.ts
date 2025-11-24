import { Router } from "express";
import { z } from "zod";
import { db } from "../db/client.js";
import { debts, debtPayments } from "../db/schema.js";
import { asyncHandler, ok } from "../utils/http.js";
import { desc, eq } from "drizzle-orm";

const router = Router();

const debtInput = z.object({
  name: z.string().min(1),
  amount: z.number().int().positive(),
  dueDay: z.number().int().min(1).max(31),
  type: z.string().min(1),
  minimumPay: z.number().int().nonnegative().optional(),
  totalDebt: z.number().int().nonnegative().optional(),
  notes: z.string().optional(),
});

router.get(
  "/debts",
  asyncHandler(async (_req, res) => {
    const rows = await db.query.debts.findMany({ orderBy: (tbl, { asc }) => asc(tbl.dueDay) });
    return ok(res, rows);
  }),
);

router.post(
  "/debts",
  asyncHandler(async (req, res) => {
    const payload = debtInput.parse(req.body);
    const [created] = await db.insert(debts).values(payload).returning();
    return ok(res, created, 201);
  }),
);

router.get(
  "/debts/payments",
  asyncHandler(async (_req, res) => {
    const rows = await db
      .select({
        id: debtPayments.id,
        debtId: debtPayments.debtId,
        amount: debtPayments.amount,
        paidAt: debtPayments.paidAt,
        name: debts.name,
      })
      .from(debtPayments)
      .leftJoin(debts, eq(debtPayments.debtId, debts.id))
      .orderBy(desc(debtPayments.paidAt))
      .limit(50);
    return ok(res, rows);
  }),
);

router.post(
  "/debts/pay",
  asyncHandler(async (req, res) => {
    const payload = z
      .object({
        debtId: z.number().int().positive(),
        amount: z.number().int().positive(),
        paidAt: z.coerce.date().optional(),
      })
      .parse(req.body);
    const [created] = await db
      .insert(debtPayments)
      .values({ debtId: payload.debtId, amount: payload.amount, paidAt: payload.paidAt })
      .returning();
    return ok(res, created, 201);
  }),
);

export default router;
