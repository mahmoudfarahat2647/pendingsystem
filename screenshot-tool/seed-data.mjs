/**
 * Fixed seeded data set for the Dark screenshot baseline (issue #341).
 *
 * These rows are served by the capture script through Playwright network
 * interception, so screenshots never depend on live database content.
 * Raw rows mirror the PostgREST `orders` select shape used by
 * `ORDERS_SELECT_WITH_ATTACHMENTS` and must stay valid for
 * `mapSupabaseOrder()` / `PersistedOrderRowSchema`.
 */

function seedRow({
	id,
	stage,
	orderNumber,
	customerName,
	vin,
	company,
	partNumber,
	description,
	model,
	status = "Pending",
	createdAt = "2026-09-10T08:00:00.000Z",
}) {
	return {
		id,
		stage,
		order_number: orderNumber,
		customer_name: customerName,
		customer_email: null,
		customer_phone: "01001234567",
		vin,
		company,
		status,
		attachment_link: "",
		attachment_file_path: "",
		attachment_file_paths: [],
		metadata: {
			parts: [{ id: `${id}-part-1`, partNumber, description, quantity: 1 }],
			partNumber,
			description,
			status,
			model,
			repairSystem: "Mechanical",
			requester: "Baseline Requester",
			cntrRdg: 12000,
			bookingDate: "",
			bookingStatus: "",
		},
		created_at: createdAt,
		updated_at: createdAt,
		order_reminders: [],
	};
}

/** Two deterministic rows per operational stage (12 rows total). */
export const SEED_ORDERS = [
	seedRow({
		id: "11111111-1111-4111-8111-111111111111",
		stage: "orders",
		orderNumber: "SEED-ORD-001",
		customerName: "Baseline Ahmed",
		vin: "BASELINEVIN00000001",
		company: "elmasria",
		partNumber: "8201000001",
		description: "Baseline front brake pad set",
		model: "Clio V",
		createdAt: "2026-09-10T08:00:00.000Z",
	}),
	seedRow({
		id: "11111111-1111-4111-8111-111111111112",
		stage: "orders",
		orderNumber: "SEED-ORD-002",
		customerName: "Seed Mona",
		vin: "SEEDVIN0000000002",
		company: null,
		partNumber: "8201000002",
		description: "Seed oil filter element",
		model: "Megane IV",
		createdAt: "2026-09-11T08:00:00.000Z",
	}),
	seedRow({
		id: "22222222-2222-4222-8222-222222222221",
		stage: "main",
		orderNumber: "SEED-MAIN-001",
		customerName: "Baseline Karim",
		vin: "BASELINEVIN00000003",
		company: "elmasria",
		partNumber: "8201000003",
		description: "Baseline rear shock absorber",
		model: "Duster II",
		createdAt: "2026-09-08T08:00:00.000Z",
	}),
	seedRow({
		id: "22222222-2222-4222-8222-222222222222",
		stage: "main",
		orderNumber: "SEED-MAIN-002",
		customerName: "Seed Hoda",
		vin: "SEEDVIN0000000004",
		company: null,
		partNumber: "8201000004",
		description: "Seed timing belt kit",
		model: "Captur II",
		createdAt: "2026-09-09T08:00:00.000Z",
	}),
	seedRow({
		id: "33333333-3333-4333-8333-333333333331",
		stage: "call",
		orderNumber: "SEED-CALL-001",
		customerName: "Baseline Omar",
		vin: "BASELINEVIN00000005",
		company: "unis",
		partNumber: "8201000005",
		description: "Baseline clutch disc assembly",
		model: "Kadjar",
		status: "Arrived",
		createdAt: "2026-09-07T08:00:00.000Z",
	}),
	seedRow({
		id: "33333333-3333-4333-8333-333333333332",
		stage: "call",
		orderNumber: "SEED-CALL-002",
		customerName: "Seed Dalia",
		vin: "SEEDVIN0000000006",
		company: null,
		partNumber: "8201000006",
		description: "Seed water pump unit",
		model: "Talisman",
		createdAt: "2026-09-06T08:00:00.000Z",
	}),
	seedRow({
		id: "44444444-4444-4444-8444-444444444441",
		stage: "booking",
		orderNumber: "SEED-BOOK-001",
		customerName: "Baseline Sara",
		vin: "BASELINEVIN00000007",
		company: "unis",
		partNumber: "8201000007",
		description: "Baseline alternator assembly",
		model: "Clio V",
		createdAt: "2026-09-05T08:00:00.000Z",
	}),
	seedRow({
		id: "44444444-4444-4444-8444-444444444442",
		stage: "booking",
		orderNumber: "SEED-BOOK-002",
		customerName: "Seed Tarek",
		vin: "SEEDVIN0000000008",
		company: null,
		partNumber: "8201000008",
		description: "Seed starter motor",
		model: "Megane IV",
		createdAt: "2026-09-04T08:00:00.000Z",
	}),
	seedRow({
		id: "55555555-5555-4555-8555-555555555551",
		stage: "archive",
		orderNumber: "SEED-ARCH-001",
		customerName: "Baseline Nour",
		vin: "BASELINEVIN00000009",
		company: "elmasria",
		partNumber: "8201000009",
		description: "Baseline radiator fan",
		model: "Duster II",
		createdAt: "2026-09-03T08:00:00.000Z",
	}),
	seedRow({
		id: "55555555-5555-4555-8555-555555555552",
		stage: "archive",
		orderNumber: "SEED-ARCH-002",
		customerName: "Seed Rami",
		vin: "SEEDVIN0000000010",
		company: null,
		partNumber: "8201000010",
		description: "Seed fuel pump module",
		model: "Kadjar",
		createdAt: "2026-09-02T08:00:00.000Z",
	}),
	seedRow({
		id: "66666666-6666-4666-8666-666666666661",
		stage: "freeze",
		orderNumber: "SEED-FRZ-001",
		customerName: "Baseline Laila",
		vin: "BASELINEVIN00000011",
		company: null,
		partNumber: "8201000011",
		description: "Baseline cabin filter",
		model: "Captur II",
		createdAt: "2026-09-01T08:00:00.000Z",
	}),
	seedRow({
		id: "66666666-6666-4666-8666-666666666662",
		stage: "freeze",
		orderNumber: "SEED-FRZ-002",
		customerName: "Seed Youssef",
		vin: "SEEDVIN0000000012",
		company: null,
		partNumber: "8201000012",
		description: "Seed air filter box",
		model: "Talisman",
		createdAt: "2026-08-31T08:00:00.000Z",
	}),
];

/** Fixed response for GET /api/storage-stats. */
export const STORAGE_STATS_MOCK = {
	dbUsedBytes: 120000000,
	dbLimitBytes: 524288000,
	dbAvailable: true,
	storageUsedBytes: 80000000,
	storageLimitBytes: 1073741824,
	storageAvailable: true,
	combinedUsedBytes: 200000000,
	combinedLimitBytes: 1598029824,
	dataComplete: true,
};

/** Fixed row for the `app_settings` Supabase singleton read. */
export const APP_SETTINGS_MOCK = {
	models: [
		"Clio V",
		"Megane IV",
		"Kadjar",
		"Captur II",
		"Duster II",
		"Talisman",
	],
	repair_systems: ["Mechanical", "Electrical", "Body"],
	requesters: ["Baseline Requester"],
};

/** Fixed response for GET /api/report-settings. */
export const REPORT_SETTINGS_MOCK = {
	id: "00000000-0000-4000-8000-000000000001",
	emails: [],
	frequency: "Weekly",
	is_enabled: false,
	last_sent_at: null,
};

/**
 * Return the seed rows matching a PostgREST orders URL.
 * Understands `stage=eq.<stage>` filters; any other query shape returns
 * the full set so dashboard counts stay fixed. Pure and unit-tested.
 */
export function filterSeedRowsByUrl(urlString) {
	let stage = null;
	try {
		const url = new URL(urlString, "http://localhost");
		for (const [key, value] of url.searchParams.entries()) {
			if (key === "stage" && value.startsWith("eq.")) {
				stage = value.slice("eq.".length);
			}
		}
	} catch {
		return [...SEED_ORDERS];
	}
	if (!stage) return [...SEED_ORDERS];
	return SEED_ORDERS.filter((row) => row.stage === stage);
}

/** Count seed rows per stage (used for the dashboard stats sanity check). */
export function countSeedRowsByStage() {
	const counts = {};
	for (const row of SEED_ORDERS) {
		counts[row.stage] = (counts[row.stage] ?? 0) + 1;
	}
	return counts;
}
