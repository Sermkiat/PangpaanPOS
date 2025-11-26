-- create missing tables if not exists to satisfy API
CREATE TABLE IF NOT EXISTS components (
  id serial PRIMARY KEY,
  code varchar(64) NOT NULL UNIQUE,
  name varchar(255) NOT NULL,
  unit varchar(32) NOT NULL DEFAULT 'unit',
  cost_per_unit double precision NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS recipes (
  id serial PRIMARY KEY,
  product_id integer NOT NULL,
  name varchar(255) NOT NULL,
  notes text,
  yield_qty double precision NOT NULL DEFAULT 1,
  yield_unit varchar(32) NOT NULL DEFAULT 'unit',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS recipe_items (
  id serial PRIMARY KEY,
  recipe_id integer NOT NULL,
  item_id integer NOT NULL,
  qty double precision NOT NULL
);

CREATE TABLE IF NOT EXISTS product_components (
  id serial PRIMARY KEY,
  product_id integer NOT NULL,
  component_id integer NOT NULL,
  qty double precision NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS expense_log (
  id serial PRIMARY KEY,
  category varchar(120) NOT NULL,
  description varchar(255) NOT NULL,
  amount double precision NOT NULL,
  payment_method varchar(32),
  incurred_on timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS waste_records (
  id serial PRIMARY KEY,
  item_id integer NOT NULL,
  qty double precision NOT NULL,
  reason varchar(255) NOT NULL,
  recorded_on timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS allocation_rules (
  id serial PRIMARY KEY,
  name varchar(120) NOT NULL,
  rule_type varchar(64) NOT NULL,
  percentage double precision NOT NULL,
  target varchar(120) NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inventory_movements (
  id serial PRIMARY KEY,
  product_id integer NOT NULL,
  change double precision NOT NULL,
  reason text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS debts (
  id serial PRIMARY KEY,
  name varchar NOT NULL,
  amount integer NOT NULL,
  due_day integer NOT NULL,
  type varchar NOT NULL,
  minimum_pay integer,
  total_debt integer,
  notes text
);

CREATE TABLE IF NOT EXISTS debt_payments (
  id serial PRIMARY KEY,
  debt_id integer REFERENCES debts(id),
  amount integer NOT NULL,
  paid_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS daily_reserve (
  id serial PRIMARY KEY,
  date date NOT NULL,
  income integer NOT NULL,
  reserve integer NOT NULL
);
