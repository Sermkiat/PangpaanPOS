CREATE TABLE IF NOT EXISTS products (
  id serial PRIMARY KEY,
  sku varchar(64) UNIQUE NOT NULL,
  name varchar(255) NOT NULL,
  category varchar(120) DEFAULT 'General',
  price double precision NOT NULL DEFAULT 0,
  image_url text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS items (
  id serial PRIMARY KEY,
  code varchar(64) UNIQUE NOT NULL,
  name varchar(255) NOT NULL,
  unit varchar(32) NOT NULL DEFAULT 'g',
  stock_qty double precision NOT NULL DEFAULT 0,
  cost_per_unit double precision NOT NULL DEFAULT 0,
  reorder_point double precision NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id serial PRIMARY KEY,
  order_number varchar(64) UNIQUE NOT NULL,
  status varchar(32) NOT NULL DEFAULT 'waiting',
  payment_status varchar(16) NOT NULL DEFAULT 'paid',
  fulfillment_status varchar(16) NOT NULL DEFAULT 'waiting',
  total double precision NOT NULL DEFAULT 0,
  payment_method varchar(32) NOT NULL DEFAULT 'cash',
  cash_received double precision,
  change double precision,
  paid_at timestamptz,
  served_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
  id serial PRIMARY KEY,
  order_id integer NOT NULL REFERENCES orders(id),
  product_id integer NOT NULL REFERENCES products(id),
  qty double precision NOT NULL,
  unit_price double precision NOT NULL,
  line_total double precision NOT NULL
);
