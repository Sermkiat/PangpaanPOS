import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
import * as schema from "./schema.js";
const { Pool } = pkg;
const connectionString = process.env.DATABASE_URL ||
    "postgresql://pang:pangpass@localhost:5432/pangpaan_pos";
export const pool = new Pool({ connectionString });
export const db = drizzle(pool, { schema });
