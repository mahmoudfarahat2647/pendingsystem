import "@testing-library/jest-dom/vitest";

// jsdom doesn't implement the Pointer Events capture API or
// `scrollIntoView`, both of which Radix UI's interactive primitives (Select,
// Dropdown Menu, Popover, etc.) call during pointer interactions. Without
// these no-op shims, any test that opens one of those components throws
// `target.hasPointerCapture is not a function`. See issue #265.
if (typeof Element !== "undefined") {
	if (!Element.prototype.hasPointerCapture) {
		Element.prototype.hasPointerCapture = () => false;
	}
	if (!Element.prototype.setPointerCapture) {
		Element.prototype.setPointerCapture = () => {};
	}
	if (!Element.prototype.releasePointerCapture) {
		Element.prototype.releasePointerCapture = () => {};
	}
	if (!Element.prototype.scrollIntoView) {
		Element.prototype.scrollIntoView = () => {};
	}
}

// Mock Supabase environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://mock-supabase-url.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "mock-anon-key";

// Auth env vars
process.env.DATABASE_URL = "postgresql://mock:mock@localhost:5432/mock";
process.env.BETTER_AUTH_URL = "http://localhost:3000";
process.env.BETTER_AUTH_SECRET = "mock-secret-for-testing-min-32-chars-long";
process.env.RESEND_API_KEY = "re_mock_key";
process.env.RESEND_FROM_EMAIL = "test@example.com";

// Wire the OrdersQueryAdapter against the same queryClient singleton tests
// already use via `queryClient.setQueryData(...)`. Without this, store slices
// (which now go through the adapter) would see the no-op default instead of
// the seeded data. See h1-plan.md step 3.
import {
	createReactQueryAdapter,
	setOrdersQueryAdapter,
} from "@/store/ordersQueryAdapter";
import { queryClient } from "./testQueryClient";

setOrdersQueryAdapter(createReactQueryAdapter(queryClient));
