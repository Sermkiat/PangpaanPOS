INSERT INTO products (sku, name, price, stock) VALUES
('SKU-001','กาแฟเย็น', 45.00, 50),
('SKU-002','ชานม',     40.00, 50),
('SKU-003','เอสเพรสโซ่', 50.00, 30)
ON CONFLICT (sku) DO NOTHING;
