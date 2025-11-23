import { Router } from "express";
import { z } from "zod";
import { db } from "../db/client.js";
import { products, productComponents, components } from "../db/schema.js";
import { asyncHandler, ok } from "../utils/http.js";
import { eq } from "drizzle-orm";

const router = Router();

const productInput = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  category: z.string().default("General"),
  price: z.number().nonnegative(),
  imageUrl: z.string().url().optional(),
  active: z.boolean().optional(),
  components: z
    .array(
      z.object({
        componentId: z.number().int().positive(),
        qty: z.number().positive(),
      }),
    )
    .default([]),
});

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const data = await db.query.products.findMany();
    return ok(res, data);
  }),
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const input = productInput.parse(req.body);
    const [created] = await db
      .insert(products)
      .values({
        sku: input.sku,
        name: input.name,
        category: input.category,
        price: input.price,
        imageUrl: input.imageUrl,
        active: input.active ?? true,
      })
      .returning();

    if (input.components.length) {
      await db.insert(productComponents).values(
        input.components.map((c) => ({
          productId: created.id,
          componentId: c.componentId,
          qty: c.qty,
        })),
      );
    }

    return ok(res, created, 201);
  }),
);

router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const input = productInput.partial().parse(req.body);
    const [updated] = await db
      .update(products)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    if (!updated) {
      return res.status(404).json({ success: false, error: "Product not found" });
    }
    if (input.components) {
      await db.delete(productComponents).where(eq(productComponents.productId, id));
      if (input.components.length) {
        await db.insert(productComponents).values(
          input.components.map((c) => ({
            productId: id,
            componentId: c.componentId,
            qty: c.qty,
          })),
        );
      }
    }
    return ok(res, updated);
  }),
);

router.get(
  "/components",
  asyncHandler(async (_req, res) => {
    const rows = await db.query.components.findMany();
    return ok(res, rows);
  }),
);

router.post(
  "/components",
  asyncHandler(async (req, res) => {
    const payload = z
      .object({
        code: z.string().min(1),
        name: z.string().min(1),
        unit: z.string().min(1),
        costPerUnit: z.number().nonnegative(),
      })
      .parse(req.body);
    const [created] = await db.insert(components).values(payload).returning();
    return ok(res, created, 201);
  }),
);

export default router;
