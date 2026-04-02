import { createSeedClient } from "./supabase";

/** Remove all rows that were seeded by E2E tests (identified by E2E_TEST_ prefix). */
export async function cleanupTestRows() {
	const db = createSeedClient();
	const { error } = await db
		.from("orders")
		.delete()
		.like("customer_name", "E2E_TEST_%");
	if (error) throw new Error(`E2E cleanup failed: ${error.message}`);
}
