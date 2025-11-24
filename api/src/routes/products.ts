import { Router } from "express";
import { z } from "zod";
import { db } from "../db/client.js";
import { products, productComponents, components, items } from "../db/schema.js";
import { asyncHandler, ok } from "../utils/http.js";
import { eq } from "drizzle-orm";

const router = Router();

const productInput = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  category: z.string().default("General"),
  price: z.number().nonnegative(),
  imageUrl: z.string().optional(),
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

const slugify = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32) || "pp";

router.post(
  "/import",
  asyncHandler(async (req, res) => {
    const { csv } = z.object({ csv: z.string().min(1) }).parse(req.body);
    const lines = csv
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length < 2) return res.status(400).json({ success: false, error: "No rows" });

    const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const idx = (key: string) => header.indexOf(key);
    const idIdx = idx("id");
    const nameIdx = idx("name");
    const categoryIdx = idx("category");
    const priceIdx = idx("price");
    const unitIdx = idx("unit");
    const stockIdx = idx("stockqty");
    const imageIdx = idx("imageurl");
    const activeIdx = idx("active");

    const existingProducts = await db.query.products.findMany();
    const productKey = (p: any) => `${p.name.toLowerCase()}|${(p.category || "general").toLowerCase()}`;
    const productMap = new Map(existingProducts.map((p) => [productKey(p), p]));

    const existingItems = await db.query.items.findMany();
    const itemMap = new Map(existingItems.map((it) => [it.name.toLowerCase(), it]));

    let insertedProducts = 0;
    let updatedProducts = 0;
    let insertedItems = 0;
    let updatedItems = 0;

    for (const line of lines.slice(1)) {
      const cols = line.split(",");
      const name = (cols[nameIdx] ?? "").trim();
      if (!name) continue;
      const category = (cols[categoryIdx] ?? "General").trim() || "General";
      const price = Number((cols[priceIdx] ?? "0").trim()) || 0;
      const unit = (cols[unitIdx] ?? "unit").trim() || "unit";
      const stockQty = Number((cols[stockIdx] ?? "0").trim()) || 0;
      const imageUrl = (cols[imageIdx] ?? "").trim() || undefined;
      const activeRaw = (cols[activeIdx] ?? "").trim().toLowerCase();
      const active = activeRaw ? activeRaw === "true" || activeRaw === "1" : true;
      const idVal = idIdx >= 0 ? Number((cols[idIdx] ?? "").trim()) : undefined;

      let product = idVal ? existingProducts.find((p) => p.id === idVal) : productMap.get(productKey({ name, category }));
      if (product) {
        const [updated] = await db
          .update(products)
          .set({ name, category, price, imageUrl, active, updatedAt: new Date() })
          .where(eq(products.id, product.id))
          .returning();
        product = updated;
        updatedProducts += 1;
      } else {
        const sku = `${slugify(name)}-${Math.random().toString(36).slice(2, 6)}`;
        const [created] = await db
          .insert(products)
          .values({ name, category, price, imageUrl, active, sku })
          .returning();
        product = created;
        productMap.set(productKey(product), product);
        insertedProducts += 1;
      }

      // inventory item sync (by name)
      const existingItem = itemMap.get(name.toLowerCase());
      if (existingItem) {
        const [updatedItem] = await db
          .update(items)
          .set({ code: existingItem.code, name, unit, stockQty, updatedAt: new Date() })
          .where(eq(items.id, existingItem.id))
          .returning();
        itemMap.set(name.toLowerCase(), updatedItem);
        updatedItems += 1;
      } else {
        const code = `${slugify(name)}-${Math.random().toString(36).slice(2, 5)}`;
        const [createdItem] = await db
          .insert(items)
          .values({ code, name, unit, stockQty, costPerUnit: 0, reorderPoint: 0 })
          .returning();
        itemMap.set(name.toLowerCase(), createdItem);
        insertedItems += 1;
      }
    }

    return ok(res, { insertedProducts, updatedProducts, insertedItems, updatedItems });
  }),
);

export default router;
