-- Add cash tracking fields for orders
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "cash_received" double precision;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "change" double precision;
