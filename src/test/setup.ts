import "@testing-library/jest-dom";

// Mock Supabase environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://mock-supabase-url.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "mock-anon-key";

// Auth env vars
process.env.DATABASE_URL = "postgresql://mock:mock@localhost:5432/mock";
process.env.BETTER_AUTH_URL = "http://localhost:3000";
process.env.BETTER_AUTH_SECRET = "mock-secret-for-testing-min-32-chars-long";
process.env.RESEND_API_KEY = "re_mock_key";
process.env.RESEND_FROM_EMAIL = "test@example.com";
