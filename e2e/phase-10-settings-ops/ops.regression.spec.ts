import { expect, test } from "../fixtures";

test.describe("Ops — Regression (P2)", () => {
	test("/api/health returns 200 with healthy status", async ({
		authedPage,
	}) => {
		const resp = await authedPage.request.get("/api/health");
		expect(resp.status()).toBe(200);
		const body = await resp.json();
		expect(body).toHaveProperty("status");
	});
});
