import { Router } from "express";
import { z } from "zod";
import { db } from "../db/client.js";
import { orders, orderItems, products } from "../db/schema.js";
import { asyncHandler, ok } from "../utils/http.js";
import { eq } from "drizzle-orm";

const router = Router();

const orderInput = z.object({
  paymentMethod: z.string().default("cash"),
  paymentStatus: z.enum(["paid", "unpaid"]).default("paid"),
  fulfillmentStatus: z.enum(["waiting", "finished"]).default("waiting"),
  notes: z.string().optional(),
  cashReceived: z.number().nonnegative().nullable().optional(),
  change: z.number().nonnegative().nullable().optional(),
  items: z
    .array(
      z.object({
        productId: z.number().int().positive(),
        qty: z.number().positive(),
      }),
    )
    .nonempty(),
});

const randomOrderNumber = () =>
  `PP-${new Date().toISOString().replace(/[-:T]/g, "").slice(0, 12)}-${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;

router.get(
  "/orders",
  asyncHandler(async (_req, res) => {
    const rows = await db.query.orders.findMany({ orderBy: (o, { desc }) => desc(o.createdAt) });
    const payload = await Promise.all(
      rows.map(async (o) => {
        const items = await db.query.orderItems.findMany({ where: eq(orderItems.orderId, o.id) });
        return { ...o, items };
      }),
    );
    return ok(res, payload);
  }),
);

router.post(
  "/orders",
  asyncHandler(async (req, res) => {
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

    const cashReceived = input.cashReceived ?? (input.paymentStatus === "paid" ? orderTotal : null);
    const change =
      input.change ??
      (input.paymentStatus === "paid" && input.paymentMethod === "cash" && cashReceived != null
        ? Math.max(0, cashReceived - orderTotal)
        : input.paymentStatus === "paid"
          ? 0
          : null);

    const [created] = await db
      .insert(orders)
      .values({
        orderNumber: randomOrderNumber(),
        status: input.fulfillmentStatus,
        paymentStatus: input.paymentStatus,
        fulfillmentStatus: input.fulfillmentStatus,
        total: orderTotal,
        paymentMethod: input.paymentMethod,
        paidAt: input.paymentStatus === "paid" ? new Date() : null,
        cashReceived,
        change,
        notes: input.notes,
      })
      .returning();

    await db.insert(orderItems).values(
      totals.map((t) => ({
        orderId: created.id,
        productId: t.productId,
        qty: t.qty,
        unitPrice: t.unitPrice,
        lineTotal: t.lineTotal,
      })),
    );

    return ok(res, { ...created, items: totals }, 201);
  }),
);

router.patch(
  "/orders/:id/status",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const parsed = z
      .object({
        fulfillmentStatus: z.enum(["waiting", "finished"]),
        paymentStatus: z.enum(["paid", "unpaid"]).optional(),
        paymentMethod: z.string().optional(),
        paidAt: z.string().datetime().optional(),
        servedAt: z.string().datetime().optional(),
        cashReceived: z.number().nullable().optional(),
        change: z.number().nullable().optional(),
      })
      .parse(req.body);

    const updatePayload: any = {
      fulfillmentStatus: parsed.fulfillmentStatus,
      status: parsed.fulfillmentStatus,
      updatedAt: new Date(),
    };
    if (parsed.paymentStatus) updatePayload.paymentStatus = parsed.paymentStatus;
    if (parsed.paymentMethod) updatePayload.paymentMethod = parsed.paymentMethod;

    if (parsed.paidAt !== undefined) {
      updatePayload.paidAt = parsed.paidAt ? new Date(parsed.paidAt) : null;
    } else if (parsed.paymentStatus === "paid") {
      updatePayload.paidAt = new Date();
    }

    if (parsed.servedAt !== undefined) {
      updatePayload.servedAt = parsed.servedAt ? new Date(parsed.servedAt) : null;
    } else if (parsed.fulfillmentStatus === "finished") {
      updatePayload.servedAt = new Date();
    }

    if (parsed.cashReceived !== undefined) updatePayload.cashReceived = parsed.cashReceived;
    if (parsed.change !== undefined) updatePayload.change = parsed.change;
    const [updated] = await db.update(orders).set(updatePayload).where(eq(orders.id, id)).returning();
    if (!updated) return res.status(404).json({ success: false, error: "Order not found" });
    return ok(res, updated);
  }),
);

export default router;
