import { Router } from "express";
import { z } from "zod";
import { db } from "../db/client.js";
import { recipes, recipeItems } from "../db/schema.js";
import { asyncHandler, ok } from "../utils/http.js";
import { eq } from "drizzle-orm";
const router = Router();
const recipeInput = z.object({
    productId: z.number().int().positive(),
    name: z.string().min(1),
    notes: z.string().optional(),
    yieldQty: z.number().positive().default(1),
    yieldUnit: z.string().default("unit"),
    items: z
        .array(z.object({
        itemId: z.number().int().positive(),
        qty: z.number().positive(),
    }))
        .default([]),
});
router.get("/recipes", asyncHandler(async (_req, res) => {
    const rows = await db.query.recipes.findMany();
    const withItems = await Promise.all(rows.map(async (r) => {
        const detail = await db.query.recipeItems.findMany({
            where: eq(recipeItems.recipeId, r.id),
        });
        return { ...r, items: detail };
    }));
    return ok(res, withItems);
}));
router.post("/recipes", asyncHandler(async (req, res) => {
    const input = recipeInput.parse(req.body);
    const [created] = await db
        .insert(recipes)
        .values({
        productId: input.productId,
        name: input.name,
        notes: input.notes,
        yieldQty: input.yieldQty,
        yieldUnit: input.yieldUnit,
    })
        .returning();
    if (input.items.length) {
        await db.insert(recipeItems).values(input.items.map((it) => ({
            recipeId: created.id,
            itemId: it.itemId,
            qty: it.qty,
        })));
    }
    return ok(res, { ...created, items: input.items }, 201);
}));
export default router;
