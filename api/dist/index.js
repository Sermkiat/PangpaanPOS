import "dotenv/config";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { fail } from "./utils/http.js";
import productRoutes from "./routes/products.js";
import inventoryRoutes from "./routes/inventory.js";
import recipeRoutes from "./routes/recipes.js";
import orderRoutes from "./routes/orders.js";
import financeRoutes from "./routes/finance.js";
const app = express();
app.use(helmet());
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "1mb" }));
app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/products", productRoutes);
app.use("/", inventoryRoutes);
app.use("/", recipeRoutes);
app.use("/", orderRoutes);
app.use("/", financeRoutes);
app.use((err, _req, res) => {
    console.error(err);
    return fail(res, err, 500);
});
const port = process.env.PORT || 8000;
app.listen(port, () => {
    console.log(`API ready on :${port}`);
});
