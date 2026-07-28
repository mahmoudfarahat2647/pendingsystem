-- Every part of an order is stored as its own row, and those rows share the
-- order's order_number by design. UNIQUE(order_number) therefore rejected every
-- attempt to add a part to an order that already existed:
--   duplicate key value violates unique constraint "orders_order_number_key"
--
-- order_number is system-generated and read for display only (global search,
-- the XLSX export, the recent_activity trigger label) — nothing looks a row up
-- by it, and the non-unique idx_orders_order_number already covers that column,
-- so dropping the unique index costs nothing.
ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_order_number_key;
