/**
 * Application-wide timing and limit constants.
 * Centralised here to avoid magic numbers scattered across the codebase.
 */

/** Debounce applied to the global header search input (ms). */
export const SEARCH_DEBOUNCE_MS = 350;

/** Debounce for the auto-move VINs processing guard (ms). */
export const AUTO_MOVE_DEBOUNCE_MS = 500;

/** Maximum age of a draft recovery snapshot before it is discarded (ms). */
export const DRAFT_RECOVERY_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

/** Connection wait timeout for Postgres pool connections (ms). */
export const DATABASE_CONNECTION_TIMEOUT_MS = 10_000;

/** Max lifetime for a Postgres query before pg aborts it (ms). */
export const DATABASE_QUERY_TIMEOUT_MS = 15_000;

/** Idle timeout for pooled Postgres clients (ms). */
export const DATABASE_IDLE_TIMEOUT_MS = 30_000;

/** Conservative pool size for auth/health queries in production deployments. */
export const DATABASE_POOL_MAX = 5;

/** Supabase request timeout used in server-side API routes (ms). */
export const SUPABASE_REQUEST_TIMEOUT_MS = 30_000;

/** Maximum length for truncated error/warning messages in the UI (chars). */
export const ERROR_MESSAGE_TRUNCATE_LENGTH = 200;
