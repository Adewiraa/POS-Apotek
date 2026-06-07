-- ============================================================
-- DATA PERMANEN: Dashboard Demo Data
-- Database: posapotek
-- ============================================================

USE posapotek;

-- ============================================================
-- 1. SALES HARI INI (Omzet & Transaksi card)
-- ============================================================
INSERT INTO sales (transaction_no, status, total, subtotal, discount, tax, payment_method, payment_status, created_at, updated_at)
VALUES
  ('TRX-PERM-001', 'Completed', 250000,  250000,  0, 0, 'Cash',  'Paid', NOW(), NOW()),
  ('TRX-PERM-002', 'Completed', 175000,  175000,  0, 0, 'QRIS',  'Paid', NOW(), NOW()),
  ('TRX-PERM-003', 'Completed', 320000,  320000,  0, 0, 'Cash',  'Paid', NOW(), NOW()),
  ('TRX-PERM-004', 'Completed', 98000,   98000,   0, 0, 'Debit', 'Paid', NOW(), NOW()),
  ('TRX-PERM-005', 'Completed', 450000,  450000,  0, 0, 'Cash',  'Paid', NOW(), NOW()),
  ('TRX-PERM-006', 'Completed', 135000,  135000,  0, 0, 'QRIS',  'Paid', NOW(), NOW()),
  ('TRX-PERM-007', 'Completed', 275000,  275000,  0, 0, 'Cash',  'Paid', NOW(), NOW());

-- ============================================================
-- 2. SALES KEMARIN (untuk perbandingan % omzet)
-- ============================================================
INSERT INTO sales (transaction_no, status, total, subtotal, discount, tax, payment_method, payment_status, created_at, updated_at)
VALUES
  ('TRX-PERM-Y01', 'Completed', 185000, 185000, 0, 0, 'Cash', 'Paid', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
  ('TRX-PERM-Y02', 'Completed', 220000, 220000, 0, 0, 'QRIS', 'Paid', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
  ('TRX-PERM-Y03', 'Completed', 145000, 145000, 0, 0, 'Cash', 'Paid', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
  ('TRX-PERM-Y04', 'Completed', 95000,  95000,  0, 0, 'Cash', 'Paid', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY));

-- ============================================================
-- 3. PRODUK DENGAN STOK KRITIS (stok <= min_stock)
-- ============================================================
INSERT INTO products (barcode, name, generic_name, category_id, unit_id, classification, selling_price, purchase_price, min_stock, is_active, created_at, updated_at)
VALUES
  ('PERM-001', 'Ranitidin 150mg',     'Ranitidine',          3, 3, 'Obat Keras',  15000, 11000, 20, 1, NOW(), NOW()),
  ('PERM-002', 'Metformin 500mg',     'Metformin HCl',       3, 3, 'Obat Keras',  18000, 14000, 15, 1, NOW(), NOW()),
  ('PERM-003', 'Ibuprofen 400mg',     'Ibuprofen',           1, 3, 'Obat Bebas',  12000, 9000,  10, 1, NOW(), NOW()),
  ('PERM-004', 'Omeprazole 20mg',     'Omeprazole',          3, 3, 'Obat Keras',  22000, 17000, 12, 1, NOW(), NOW()),
  ('PERM-005', 'Salbutamol 4mg',      'Salbutamol Sulfate',  3, 3, 'Obat Keras',  9500,  7000,  8,  1, NOW(), NOW());

-- Ambil ID produk yang baru diinsert (digunakan untuk batch)
SET @ranitidin_id   = (SELECT id FROM products WHERE barcode = 'PERM-001');
SET @metformin_id   = (SELECT id FROM products WHERE barcode = 'PERM-002');
SET @ibuprofen_id   = (SELECT id FROM products WHERE barcode = 'PERM-003');
SET @omeprazole_id  = (SELECT id FROM products WHERE barcode = 'PERM-004');
SET @salbutamol_id  = (SELECT id FROM products WHERE barcode = 'PERM-005');

-- Batch dengan stok HABIS (high priority) dan stok sangat rendah
INSERT INTO product_batches (product_id, batch_no, expired_date, supplier_id, qty_available, status, created_at, updated_at)
VALUES
  (@ranitidin_id,   'PERM-BCH-001', DATE_ADD(NOW(), INTERVAL 18 MONTH), 1, 0,  'Active', NOW(), NOW()), -- HABIS (high priority)
  (@metformin_id,   'PERM-BCH-002', DATE_ADD(NOW(), INTERVAL 24 MONTH), 2, 3,  'Active', NOW(), NOW()), -- kritis (< min_stock 15)
  (@ibuprofen_id,   'PERM-BCH-003', DATE_ADD(NOW(), INTERVAL 12 MONTH), 1, 2,  'Active', NOW(), NOW()), -- kritis (< min_stock 10)
  (@omeprazole_id,  'PERM-BCH-004', DATE_ADD(NOW(), INTERVAL 20 MONTH), 1, 0,  'Active', NOW(), NOW()), -- HABIS (high priority)
  (@salbutamol_id,  'PERM-BCH-005', DATE_ADD(NOW(), INTERVAL 15 MONTH), 2, 5,  'Active', NOW(), NOW()); -- kritis (< min_stock 8)

-- ============================================================
-- 4. PRODUCT BATCHES MENDEKATI ED (≤ 90 hari)
-- Menggunakan produk yang sudah ada (id 1=Panadol, 2=Amoxsan, 3=Promag)
-- ============================================================
INSERT INTO product_batches (product_id, batch_no, expired_date, supplier_id, qty_available, status, created_at, updated_at)
VALUES
  (1, 'PERM-ED-001', DATE_ADD(NOW(), INTERVAL 10  DAY),  1, 20, 'Active', NOW(), NOW()),  -- < 30 hari → butuh FEFO
  (2, 'PERM-ED-002', DATE_ADD(NOW(), INTERVAL 25  DAY),  2, 15, 'Active', NOW(), NOW()),  -- < 30 hari → butuh FEFO
  (3, 'PERM-ED-003', DATE_ADD(NOW(), INTERVAL 55  DAY),  1, 30, 'Active', NOW(), NOW()),  -- 30–90 hari
  (1, 'PERM-ED-004', DATE_ADD(NOW(), INTERVAL 80  DAY),  1, 10, 'Active', NOW(), NOW()),  -- 30–90 hari
  (2, 'PERM-ED-005', DATE_ADD(NOW(), INTERVAL 88  DAY),  2, 8,  'Active', NOW(), NOW());  -- 30–90 hari
