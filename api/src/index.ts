import "dotenv/config";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { existsSync, mkdirSync } from "fs";
import { fail } from "./utils/http.js";
import productRoutes from "./routes/products.js";
import inventoryRoutes from "./routes/inventory.js";
import recipeRoutes from "./routes/recipes.js";
import orderRoutes from "./routes/orders.js";
import financeRoutes from "./routes/finance.js";
import debtsRoutes from "./routes/debts.js";
import reserveRoutes from "./routes/reserve.js";

const app = express();
const uploadDir = process.env.UPLOAD_DIR || "/app/uploads";
if (!existsSync(uploadDir)) {
  mkdirSync(uploadDir, { recursive: true });
}

app.use(helmet());
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "25mb" }));
app.use("/uploads", express.static(uploadDir));

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/products", productRoutes);
app.use("/", inventoryRoutes);
app.use("/", recipeRoutes);
app.use("/", orderRoutes);
app.use("/", financeRoutes);
app.use("/", debtsRoutes);
app.use("/", reserveRoutes);

app.use((err: unknown, _req: express.Request, res: express.Response) => {
  console.error(err);
  return fail(res, err, 500);
});

const port = process.env.PORT || 8000;
app.listen(port, () => {
  console.log(`API ready on :${port}`);
});
