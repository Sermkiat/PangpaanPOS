import { pgTable, serial, varchar, timestamp, integer, text, boolean, doublePrecision } from "drizzle-orm/pg-core";
export const products = pgTable("products", {
    id: serial("id").primaryKey(),
    sku: varchar("sku", { length: 64 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    category: varchar("category", { length: 120 }).default("General"),
    price: doublePrecision("price").notNull().default(0),
    imageUrl: text("image_url"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
export const components = pgTable("components", {
    id: serial("id").primaryKey(),
    code: varchar("code", { length: 64 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    unit: varchar("unit", { length: 32 }).notNull().default("unit"),
    costPerUnit: doublePrecision("cost_per_unit").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
export const items = pgTable("items", {
    id: serial("id").primaryKey(),
    code: varchar("code", { length: 64 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    unit: varchar("unit", { length: 32 }).notNull().default("g"),
    stockQty: doublePrecision("stock_qty").notNull().default(0),
    costPerUnit: doublePrecision("cost_per_unit").notNull().default(0),
    reorderPoint: doublePrecision("reorder_point").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
export const recipes = pgTable("recipes", {
    id: serial("id").primaryKey(),
    productId: integer("product_id").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    notes: text("notes"),
    yieldQty: doublePrecision("yield_qty").notNull().default(1),
    yieldUnit: varchar("yield_unit", { length: 32 }).notNull().default("unit"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
export const recipeItems = pgTable("recipe_items", {
    id: serial("id").primaryKey(),
    recipeId: integer("recipe_id").notNull(),
    itemId: integer("item_id").notNull(),
    qty: doublePrecision("qty").notNull(),
});
export const productComponents = pgTable("product_components", {
    id: serial("id").primaryKey(),
    productId: integer("product_id").notNull(),
    componentId: integer("component_id").notNull(),
    qty: doublePrecision("qty").notNull().default(1),
});
export const orders = pgTable("orders", {
    id: serial("id").primaryKey(),
    orderNumber: varchar("order_number", { length: 64 }).notNull().unique(),
    status: varchar("status", { length: 32 }).notNull().default("pending"),
    total: doublePrecision("total").notNull().default(0),
    paymentMethod: varchar("payment_method", { length: 32 }).notNull().default("cash"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
export const orderItems = pgTable("order_items", {
    id: serial("id").primaryKey(),
    orderId: integer("order_id").notNull(),
    productId: integer("product_id").notNull(),
    qty: doublePrecision("qty").notNull(),
    unitPrice: doublePrecision("unit_price").notNull(),
    lineTotal: doublePrecision("line_total").notNull(),
});
export const expenseLog = pgTable("expense_log", {
    id: serial("id").primaryKey(),
    category: varchar("category", { length: 120 }).notNull(),
    description: varchar("description", { length: 255 }).notNull(),
    amount: doublePrecision("amount").notNull(),
    incurredOn: timestamp("incurred_on", { withTimezone: true }).notNull().defaultNow(),
});
export const wasteRecords = pgTable("waste_records", {
    id: serial("id").primaryKey(),
    itemId: integer("item_id").notNull(),
    qty: doublePrecision("qty").notNull(),
    reason: varchar("reason", { length: 255 }).notNull(),
    recordedOn: timestamp("recorded_on", { withTimezone: true }).defaultNow(),
});
export const allocationRules = pgTable("allocation_rules", {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 120 }).notNull(),
    ruleType: varchar("rule_type", { length: 64 }).notNull(),
    percentage: doublePrecision("percentage").notNull(),
    target: varchar("target", { length: 120 }).notNull(),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
