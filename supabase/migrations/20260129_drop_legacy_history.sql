-- Drop legacy history feature objects
DROP TABLE IF EXISTS history CASCADE;
DROP TABLE IF EXISTS activity_log CASCADE;
DROP TABLE IF EXISTS recent_activity CASCADE;

DROP TRIGGER IF EXISTS tr_log_order_activity ON orders;
DROP FUNCTION IF EXISTS fn_log_order_activity();
