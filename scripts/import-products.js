#!/usr/bin/env node
// Quick importer: read CSV and POST to /products/import
import fs from "fs";

const args = process.argv.slice(2);
const getArg = (name, fallback) => {
  const key = `--${name}=`;
  const found = args.find((a) => a.startsWith(key));
  if (found) return found.slice(key.length);
  const idx = args.indexOf(`--${name}`);
  if (idx !== -1 && args[idx + 1]) return args[idx + 1];
  return fallback;
};

const file = getArg("file", "ProductList_Cost.csv");
const apiBase = getArg("api", process.env.API_BASE || "http://localhost:8000");

if (!fs.existsSync(file)) {
  console.error(`CSV file not found: ${file}`);
  process.exit(1);
}

const csv = fs.readFileSync(file, "utf8");

const run = async () => {
  const res = await fetch(`${apiBase}/products/import`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ csv }),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error(`Import failed (${res.status}): ${text}`);
    process.exit(1);
  }
  const data = await res.json();
  console.log("Import success:", data);
};

run().catch((err) => {
  console.error("Import error:", err);
  process.exit(1);
});
