import { Router } from "express";
import { z } from "zod";
import { db } from "../db/client.js";
import { orders, orderItems } from "../db/schema.js";
import { asyncHandler, ok } from "../utils/http.js";
import { eq } from "drizzle-orm";
const router = Router();
const orderInput = z.object({
    status: z.string().default("pending"),
    paymentMethod: z.string().default("cash"),
    notes: z.string().optional(),
    items: z
        .array(z.object({
        productId: z.number().int().positive(),
        qty: z.number().positive(),
    }))
        .nonempty(),
});
const randomOrderNumber = () => `PP-${new Date().toISOString().replace(/[-:T]/g, "").slice(0, 12)}-${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;
router.get("/orders", asyncHandler(async (_req, res) => {
    const rows = await db.query.orders.findMany({ orderBy: (o, { desc }) => desc(o.createdAt) });
    const payload = await Promise.all(rows.map(async (o) => {
        const items = await db.query.orderItems.findMany({ where: eq(orderItems.orderId, o.id) });
        return { ...o, items };
    }));
    return ok(res, payload);
}));
router.post("/orders", asyncHandler(async (req, res) => {
    const input = orderInput.parse(req.body);
    // compute totals
    const productIds = input.items.map((i) => i.productId);
    const found = await db.query.products.findMany({
        where: (p, { inArray }) => inArray(p.id, productIds),
    });
    const totals = input.items.map((line) => {
        const product = found.find((p) => p.id === line.productId);
        const unitPrice = Number(product?.price ?? 0);
        const lineTotal = unitPrice * line.qty;
        return { ...line, unitPrice, lineTotal };
    });
    const orderTotal = totals.reduce((acc, t) => acc + t.lineTotal, 0);
    const [created] = await db
        .insert(orders)
        .values({
        orderNumber: randomOrderNumber(),
        status: input.status,
        total: orderTotal,
        paymentMethod: input.paymentMethod,
        notes: input.notes,
    })
        .returning();
    await db.insert(orderItems).values(totals.map((t) => ({
        orderId: created.id,
        productId: t.productId,
        qty: t.qty,
        unitPrice: t.unitPrice,
        lineTotal: t.lineTotal,
    })));
    return ok(res, { ...created, items: totals }, 201);
}));
router.patch("/orders/:id/status", asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const { status } = z.object({ status: z.string().min(1) }).parse(req.body);
    const [updated] = await db
        .update(orders)
        .set({ status, updatedAt: new Date() })
        .where(eq(orders.id, id))
        .returning();
    if (!updated)
        return res.status(404).json({ success: false, error: "Order not found" });
    return ok(res, updated);
}));
export default router;
