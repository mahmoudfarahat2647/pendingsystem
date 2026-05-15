-- rate_limits: cross-instance rate limiting for public endpoints.
-- Keyed on (ip, window_start) where window_start is the Unix millisecond
-- timestamp of the current hour boundary. Used by /api/mobile-order.
CREATE TABLE IF NOT EXISTS rate_limits (
  ip TEXT NOT NULL,
  window_start BIGINT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (ip, window_start)
);

-- Automatically delete rows older than 25 hours to keep the table small.
-- The function returns true when the caller is rate-limited (count already
-- at or above max_requests before this call) and false otherwise.
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_ip TEXT,
  p_window_start BIGINT,
  p_max_requests INTEGER
) RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  INSERT INTO rate_limits (ip, window_start, request_count)
  VALUES (p_ip, p_window_start, 1)
  ON CONFLICT (ip, window_start)
  DO UPDATE SET request_count = rate_limits.request_count + 1
  RETURNING request_count INTO v_count;

  RETURN v_count > p_max_requests;
END;
$$;

-- Prune stale rows (older than 25 h) so the table stays bounded.
CREATE OR REPLACE FUNCTION prune_rate_limits() RETURNS void
LANGUAGE sql
AS $$
  DELETE FROM rate_limits
  WHERE window_start < (EXTRACT(EPOCH FROM now()) * 1000)::BIGINT - 90000000;
$$;
