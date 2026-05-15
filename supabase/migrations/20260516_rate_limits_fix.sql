-- Drop old fixed-window objects
DROP FUNCTION IF EXISTS check_rate_limit(TEXT, BIGINT, INTEGER);
DROP FUNCTION IF EXISTS prune_rate_limits();
DROP TABLE IF EXISTS rate_limits;

-- Rolling-window table: one row per request, indexed for fast IP+time queries
CREATE TABLE rate_limits (
  id           BIGSERIAL    PRIMARY KEY,
  ip           TEXT         NOT NULL,
  requested_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX rate_limits_ip_time ON rate_limits (ip, requested_at);

-- Lock down table from all public roles
REVOKE ALL ON rate_limits FROM PUBLIC, anon, authenticated;
GRANT ALL ON rate_limits TO service_role;
GRANT USAGE, SELECT ON SEQUENCE rate_limits_id_seq TO service_role;

-- Rolling-window RPC: prune + insert + count in one round-trip
-- SECURITY DEFINER ensures table access works regardless of caller role
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_ip           TEXT,
  p_max_requests INTEGER
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE v_count INTEGER;
BEGIN
  DELETE FROM rate_limits
    WHERE requested_at < now() - interval '1 hour';

  INSERT INTO rate_limits (ip) VALUES (p_ip);

  SELECT COUNT(*) INTO v_count
    FROM rate_limits
   WHERE ip = p_ip
     AND requested_at >= now() - interval '1 hour';

  RETURN v_count > p_max_requests;
END;
$$;

REVOKE EXECUTE ON FUNCTION check_rate_limit(TEXT, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION check_rate_limit(TEXT, INTEGER) TO service_role;

-- Standalone prune (called probabilistically from the route)
CREATE OR REPLACE FUNCTION prune_rate_limits() RETURNS void
LANGUAGE sql
AS $$
  DELETE FROM rate_limits WHERE requested_at < now() - interval '1 hour';
$$;

REVOKE EXECUTE ON FUNCTION prune_rate_limits() FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION prune_rate_limits() TO service_role;
