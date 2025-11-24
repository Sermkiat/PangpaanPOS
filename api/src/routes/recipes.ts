import { Router } from "express";
import { z } from "zod";
import { db } from "../db/client.js";
import { items, recipes, recipeItems } from "../db/schema.js";
import { asyncHandler, ok } from "../utils/http.js";
import { eq } from "drizzle-orm";

const router = Router();

const recipeInput = z.object({
  name: z.string().min(1).optional(),
  notes: z.string().optional(),
  yieldQty: z.number().positive().default(1),
  yieldUnit: z.string().default("unit"),
  items: z
    .array(
      z.object({
        itemId: z.number().int().positive(),
        qty: z.number().positive(),
      }),
    )
    .default([]),
});

async function loadRecipeWithItems(recipeId: number) {
  const recipe = await db.query.recipes.findFirst({ where: eq(recipes.id, recipeId) });
  if (!recipe) return null;
  const rows = await db
    .select({
      itemId: recipeItems.itemId,
      qty: recipeItems.qty,
      itemName: items.name,
      costPerUnit: items.costPerUnit,
      unit: items.unit,
    })
    .from(recipeItems)
    .leftJoin(items, eq(items.id, recipeItems.itemId))
    .where(eq(recipeItems.recipeId, recipeId));
  return { ...recipe, items: rows };
}

router.get(
  "/recipes",
  asyncHandler(async (_req, res) => {
    const rows = await db.query.recipes.findMany();
    const withItems = await Promise.all(rows.map((r) => loadRecipeWithItems(r.id)));
    return ok(res, withItems.filter(Boolean));
  }),
);

router.get(
  "/recipes/:productId",
  asyncHandler(async (req, res) => {
    const productId = Number(req.params.productId);
    const existing = await db.query.recipes.findFirst({ where: eq(recipes.productId, productId) });
    if (!existing) return ok(res, null);
    const withItems = await loadRecipeWithItems(existing.id);
    return ok(res, withItems);
  }),
);

router.post(
  "/recipes/:productId",
  asyncHandler(async (req, res) => {
    const productId = Number(req.params.productId);
    const input = recipeInput.parse(req.body);

    const existing = await db.query.recipes.findFirst({ where: eq(recipes.productId, productId) });
    let recipeId: number;
    if (existing) {
      const [updated] = await db
        .update(recipes)
        .set({
          name: input.name || existing.name,
          notes: input.notes,
          yieldQty: input.yieldQty,
          yieldUnit: input.yieldUnit,
          productId,
        })
        .where(eq(recipes.id, existing.id))
        .returning();
      await db.delete(recipeItems).where(eq(recipeItems.recipeId, existing.id));
      recipeId = updated.id;
    } else {
      const [created] = await db
        .insert(recipes)
        .values({
          productId,
          name: input.name || `Recipe for product ${productId}`,
          notes: input.notes,
          yieldQty: input.yieldQty,
          yieldUnit: input.yieldUnit,
        })
        .returning();
      recipeId = created.id;
    }

    if (input.items.length) {
      await db.insert(recipeItems).values(input.items.map((it) => ({ recipeId, itemId: it.itemId, qty: it.qty })));
    }

    const full = await loadRecipeWithItems(recipeId);
    return ok(res, full, 201);
  }),
);

export default router;
