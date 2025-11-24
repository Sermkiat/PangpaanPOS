import { Router } from "express";
import { z } from "zod";
import { db } from "../db/client.js";
import { items, inventoryMovements } from "../db/schema.js";
import { asyncHandler, ok } from "../utils/http.js";
import { desc, eq, sql } from "drizzle-orm";

const router = Router();

const itemInput = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  unit: z.string().default("g"),
  stockQty: z.number().nonnegative().default(0),
  costPerUnit: z.number().nonnegative().default(0),
  reorderPoint: z.number().nonnegative().default(0),
});

router.get(
  "/inventory",
  asyncHandler(async (_req, res) => {
    const rows = await db.query.items.findMany({ orderBy: (tbl, { asc }) => asc(tbl.name) });
    return ok(res, rows);
  }),
);

router.get(
  "/items",
  asyncHandler(async (_req, res) => {
    const rows = await db.query.items.findMany({ orderBy: (tbl, { asc }) => asc(tbl.name) });
    return ok(res, rows);
  }),
);

router.post(
  "/items",
  asyncHandler(async (req, res) => {
    const payload = itemInput.parse(req.body);
    const [created] = await db.insert(items).values(payload).returning();
    return ok(res, created, 201);
  }),
);

router.put(
  "/items/:id",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const payload = itemInput.partial().parse(req.body);
    const [updated] = await db
      .update(items)
      .set({ ...payload, updatedAt: new Date() })
      .where(eq(items.id, id))
      .returning();
    if (!updated) return res.status(404).json({ success: false, error: "Item not found" });
    return ok(res, updated);
  }),
);

router.post(
  "/items/:id/adjust",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const { delta, reason } = z.object({ delta: z.number(), reason: z.string().optional() }).parse(req.body);
    const [updated] = await db
      .update(items)
      .set({ stockQty: sql`${items.stockQty} + ${delta}`, updatedAt: new Date() })
      .where(eq(items.id, id))
      .returning();
    if (!updated) return res.status(404).json({ success: false, error: "Item not found" });
    await db.insert(inventoryMovements).values({ productId: id, change: delta, reason });
    return ok(res, updated);
  }),
);

router.get(
  "/inventory/movements",
  asyncHandler(async (_req, res) => {
    const rows = await db
      .select({
        id: inventoryMovements.id,
        productId: inventoryMovements.productId,
        change: inventoryMovements.change,
        reason: inventoryMovements.reason,
        createdAt: inventoryMovements.createdAt,
        name: items.name,
      })
      .from(inventoryMovements)
      .leftJoin(items, eq(items.id, inventoryMovements.productId))
      .orderBy(desc(inventoryMovements.id));
    return ok(res, rows);
  }),
);

export default router;
