# Pangpaan POS - Notes (resume)

## สถานะล่าสุด (26 Nov 2025)
- โค้ดบน branch `main`, tag v0.1.1 + commits เพิ่มเติม (inventory inline edit, API tables)
- Docker services: db(5438), api(8088), web(8090)
- DB มีสินค้าจาก `ProductList.csv` 54 รายการ (ราคาใช้คอลัมน์ Price)
- สร้างตารางที่ขาดแล้วผ่าน `scripts/db_create_missing.sql` (recipes, expense_log, waste_records, allocation_rules, inventory_movements, debts, etc.)

## คอนฟิกสำคัญ
```
DATABASE_URL=postgresql://pang:pangpass@localhost:5438/pangpaan_pos
INTERNAL_API_BASE=http://api:8000
NEXT_PUBLIC_API_BASE=
PUBLIC_UPLOAD_BASE=http://localhost:8088
UPLOAD_DIR=./uploads
```

## คำสั่งหลัก
- รัน docker: `docker compose up -d --build`
- นำเข้าสินค้า: `npm run import:products -- --file ProductList.csv --api http://localhost:8088`
- สร้างตารางที่ขาด: `docker exec -i pangpaan_db psql -U pang -d pangpaan_pos < scripts/db_create_missing.sql`

## งานที่ทำไป
- POS: หมวด+ค้นหาแถวเดียว, แสดงจำนวนสินค้าเป็นวงกลมเขียว, ซ่อนสินค้าที่ hide, panel คิดเงิน sticky บนจอกว้าง
- Orders: Queue waiting เป็น grid responsive
- Inventory: Product Catalog inline edit (ชื่อ/หมวด/ราคา/รูป/สถานะ), page size selector, badge ต่อหมวด (On/Hide)
- Navbar ซ่อน scrollbar

## งานค้าง/ต่อไป
- ปุ่มลอยอาจทับ popup บางจอ (ลด z-index แล้ว; ถ้าจะซ่อนเมื่อ modal เปิดต้องเพิ่มเงื่อนไข)
- UI เพิ่มเติมตามคำขอ (search/icon/badge/scrollbar) หากต้องการปรับต่อ
- Inventory: ปรับ UX เพิ่มเติม (หมวดหมู่, page size, hide) ตามต้องการ
- ทดสอบ API endpoints อื่นหลังสร้างตาราง (ควรไม่ 500 แล้ว)
- ถ้าขึ้น Pi5: `git pull` + ตั้ง .env + `docker compose up -d --build` + import ProductList.csv (ถ้า DB ใหม่)

## เช็กเร็วเมื่อเปิดใหม่
- `docker compose ps` (db/api/web ต้อง up)
- `curl http://localhost:8088/health` และ `/products` (ควรได้ 54 รายการ)
- เปิด POS: http://localhost:8090 (หรือ iPhone http://192.168.1.9:8090); หากไม่เห็นอัปเดตให้ hard refresh/ล้าง cache
