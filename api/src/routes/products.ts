import { Router } from "express";
import { z } from "zod";
import { db } from "../db/client.js";
import { products, productComponents, components, items } from "../db/schema.js";
import { asyncHandler, ok } from "../utils/http.js";
import { eq } from "drizzle-orm";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import path from "path";

const router = Router();
const uploadDir = process.env.UPLOAD_DIR || "/app/uploads";
const publicUploadBase = (process.env.PUBLIC_UPLOAD_BASE || "").replace(/\/$/, "");
const MAX_IMAGE_SIZE_BYTES = 1_000_000;

const productInput = z.object({
  sku: z.string().optional(),
  name: z.string().min(1),
  category: z.string().optional(),
  price: z.number().nonnegative(),
  imageUrl: z.string().optional(), // URL หรือ data:image;base64
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

const slugify = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32) || "pp";

const ensureUploadDir = () => {
  if (!existsSync(uploadDir)) {
    mkdirSync(uploadDir, { recursive: true });
  }
};

function saveBase64Image(dataUrl?: string) {
  if (!dataUrl) return undefined;
  const trimmed = dataUrl.trim();
  if (!trimmed) return undefined;
  if (!trimmed.startsWith("data:image")) return trimmed;

  const [meta, base64] = trimmed.split(",");
  if (!base64) return trimmed;
  const buffer = Buffer.from(base64, "base64");
  if (buffer.length > MAX_IMAGE_SIZE_BYTES) {
    const err: any = new Error("Image too large (max 1MB)");
    err.status = 413;
    throw err;
  }
  const match = /data:image\/(.+);base64/.exec(meta || "");
  const ext = (match?.[1] || "png").split(/[+;]/)[0];

  // ถ้าไม่กำหนด public base ให้เก็บ data URL ไว้ตรง ๆ เพื่อให้ UI แสดงผลได้แน่นอน
  if (!publicUploadBase) return trimmed;

  ensureUploadDir();
  const fileName = `product-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`;
  const filePath = path.join(uploadDir, fileName);
  writeFileSync(filePath, buffer);
  return `${publicUploadBase}/uploads/${fileName}`;
}

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
    const name = input.name.trim();
    const category = (input.category || "General").trim() || "General";
    const sku = (input.sku?.trim() || `${slugify(name)}-${Date.now().toString().slice(-4)}`).slice(0, 64);
    const cleanedImageUrl = saveBase64Image(input.imageUrl);
    try {
      const [created] = await db
        .insert(products)
        .values({
          sku,
          name,
          category,
          price: Number(input.price ?? 0),
          imageUrl: cleanedImageUrl,
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
    } catch (err: any) {
      if (err?.code === "23505") {
        console.error("Create product duplicate SKU", err?.detail || err?.message);
        return res.status(409).json({ success: false, error: "SKU already exists", detail: err?.detail });
      }
      if (err?.status) {
        return res.status(err.status).json({ success: false, error: err.message });
      }
      console.error("Create product failed", err);
      throw err;
    }
  }),
);

router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const input = productInput.partial().parse(req.body);
    const cleanedUpdateImage = input.imageUrl !== undefined ? saveBase64Image(input.imageUrl) : undefined;
    const sku = input.sku?.trim();

    const updatePayload: any = { updatedAt: new Date() };
    if (sku) updatePayload.sku = sku;
    if (input.name !== undefined) updatePayload.name = input.name.trim();
    if (input.category !== undefined) updatePayload.category = input.category.trim() || "General";
    if (input.price !== undefined) updatePayload.price = Number(input.price);
    if (input.active !== undefined) updatePayload.active = input.active;
    if (cleanedUpdateImage !== undefined) updatePayload.imageUrl = cleanedUpdateImage;

    try {
      const [updated] = await db
        .update(products)
        .set(updatePayload)
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
    } catch (err: any) {
      if (err?.code === "23505") {
        console.error("Update product duplicate SKU", err?.detail || err?.message);
        return res.status(409).json({ success: false, error: "SKU already exists", detail: err?.detail });
      }
      if (err?.status) {
        return res.status(err.status).json({ success: false, error: err.message });
      }
      console.error("Update product failed", err);
      throw err;
    }
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

router.post(
  "/import",
  asyncHandler(async (req, res) => {
    const { csv } = z.object({ csv: z.string().min(1) }).parse(req.body);
    const lines = csv
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length < 2) return res.status(400).json({ success: false, error: "No rows" });

    const header = lines[0].split(",").map((h) => h.trim());
    const normalized = header.map((h) => h.toLowerCase().replace(/\s+/g, ""));
    const idx = (key: string) => normalized.indexOf(key.toLowerCase().replace(/\s+/g, ""));
    const firstIdx = (...keys: string[]) => keys.map(idx).find((i) => i >= 0) ?? -1;

    const skuIdx = firstIdx("sku", "productcode");
    const idIdx = idx("id");
    const nameIdx = firstIdx("name", "productnameeng", "productnamethai", "name_eng", "name_thai", "nameenglish");
    const categoryIdx = firstIdx("category", "group");
    const priceIdx = firstIdx("price", "priceuint", "price_unit", "price_baht", "pricebaht");
    const costIdx = -1; // ignore cost column; use price only
    const unitIdx = firstIdx("unit", "1unitproduct", "unitproduct");
    const stockIdx = firstIdx("stockqty", "stock", "qty");
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
      const priceRaw = priceIdx >= 0 ? (cols[priceIdx] ?? "0").trim() : "";
      const price = priceRaw ? Number(priceRaw) || 0 : 0; // ใช้ price จาก CSV เท่านั้น
      const cost = 0; // ไม่ใช้ cost per unit จาก CSV
      const unit = (cols[unitIdx] ?? "unit").trim() || "unit";
      const stockQty = Number((cols[stockIdx] ?? "0").trim()) || 0;
      const rawImage = (cols[imageIdx] ?? "").trim() || undefined;
      const imageUrl = rawImage?.startsWith("data:image") ? saveBase64Image(rawImage) : rawImage;
      const activeRaw = (cols[activeIdx] ?? "").trim().toLowerCase();
      const active = activeRaw ? activeRaw === "true" || activeRaw === "1" : true;
      const idVal = idIdx >= 0 ? Number((cols[idIdx] ?? "").trim()) : undefined;
      const sku = skuIdx >= 0 ? (cols[skuIdx] ?? "").trim() : "";

      let product = idVal
        ? existingProducts.find((p) => p.id === idVal)
        : sku
          ? existingProducts.find((p) => p.sku === sku)
          : productMap.get(productKey({ name, category }));
      if (product) {
        const [updated] = await db
          .update(products)
          .set({ name, category, price, imageUrl, active, updatedAt: new Date(), sku: product.sku || sku || product.sku })
          .where(eq(products.id, product.id))
          .returning();
        product = updated;
        updatedProducts += 1;
      } else {
        const [created] = await db
          .insert(products)
          .values({
            name,
            category,
            price,
            imageUrl,
            active,
            sku: sku || `${slugify(name)}-${Math.random().toString(36).slice(2, 6)}`,
          })
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
          .set({
            code: existingItem.code,
            name,
            unit,
            stockQty,
            costPerUnit: cost || existingItem.costPerUnit,
            updatedAt: new Date(),
          })
          .where(eq(items.id, existingItem.id))
          .returning();
        itemMap.set(name.toLowerCase(), updatedItem);
        updatedItems += 1;
      } else {
        const code = `${slugify(name)}-${Math.random().toString(36).slice(2, 5)}`;
        const [createdItem] = await db
          .insert(items)
          .values({ code, name, unit, stockQty, costPerUnit: cost, reorderPoint: 0 })
          .returning();
        itemMap.set(name.toLowerCase(), createdItem);
        insertedItems += 1;
      }
    }

    return ok(res, { insertedProducts, updatedProducts, insertedItems, updatedItems });
  }),
);

export default router;
