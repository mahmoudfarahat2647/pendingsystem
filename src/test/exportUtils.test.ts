import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ORDER_STAGES } from "../lib/constants";
import {
	exportAllSystemDataCSV,
	fetchAllRowsForExport,
	sanitizeCsvField,
} from "../lib/exportUtils";
import type { PendingRow } from "../types";

describe("exportUtils", () => {
	const OriginalBlob = global.Blob;
	let lastCsvContent = "";

	beforeEach(() => {
		vi.restoreAllMocks();
		lastCsvContent = "";

		// Replace Blob with a subclass that captures CSV content
		global.Blob = class CaptureBlob extends OriginalBlob {
			constructor(parts?: BlobPart[], options?: BlobPropertyBag) {
				super(parts, options);
				lastCsvContent = parts && parts.length > 0 ? String(parts[0]) : "";
			}
		};

		// Mock browser environment for CSV export
		global.URL.createObjectURL = vi.fn().mockReturnValue("blob:mock-url");

		// Setup mock link element with click spy
		const mockClick = vi.fn();
		const mockLink = {
			setAttribute: vi.fn(),
			style: { visibility: "" },
			click: mockClick,
		} as unknown as HTMLAnchorElement;

		const originalCreateElement = document.createElement.bind(document);
		vi.spyOn(document, "createElement").mockImplementation((tagName) => {
			if (tagName === "a") return mockLink;
			return originalCreateElement(tagName);
		});

		vi.spyOn(document.body, "appendChild").mockImplementation(
			() => null as unknown as Node,
		);
		vi.spyOn(document.body, "removeChild").mockImplementation(
			() => null as unknown as Node,
		);
	});

	afterEach(() => {
		global.Blob = OriginalBlob;
	});

	const mockData: PendingRow[] = [
		{
			id: "1",
			baseId: "test-1",
			sabNumber: "123",
			company: "Renault",
			customerName: "Alice",
			vin: "VF1",
			partNumber: "P1",
			description: "D1",
			quantity: 1,
			status: "Pending",
			parts: [],
			rDate: "",
			model: "Clio",
			mobile: "123",
			cntrRdg: 0,
			trackingId: "T1",
			acceptedBy: "tester",
			requester: "tester",
			repairSystem: "system",
			startWarranty: "2024-01-01",
			endWarranty: "2025-01-01",
			remainTime: "365",
		},
		{
			id: "2",
			baseId: "test-2",
			sabNumber: "456",
			company: "Zeekr",
			customerName: "Bob",
			vin: "LZ1",
			partNumber: "P2",
			description: "D2",
			quantity: 1,
			status: "Pending",
			parts: [],
			rDate: "",
			model: "001",
			mobile: "456",
			cntrRdg: 0,
			trackingId: "T2",
			acceptedBy: "tester",
			requester: "tester",
			repairSystem: "system",
			startWarranty: "2024-01-01",
			endWarranty: "2025-01-01",
			remainTime: "365",
		},
		{
			id: "3",
			baseId: "test-3",
			sabNumber: "789",
			company: "Renault",
			customerName: "Charlie",
			vin: "VF2",
			partNumber: "P3",
			description: "D3",
			quantity: 1,
			status: "Pending",
			parts: [],
			rDate: "",
			model: "Megane",
			mobile: "789",
			cntrRdg: 0,
			trackingId: "T3",
			acceptedBy: "tester",
			requester: "tester",
			repairSystem: "system",
			startWarranty: "2024-01-01",
			endWarranty: "2025-01-01",
			remainTime: "365",
		},
	];

	it("should export only Renault rows when Renault is selected", () => {
		exportAllSystemDataCSV(mockData, "Renault");

		// biome-ignore lint/suspicious/noExplicitAny: Test mock access
		const mockLink = (document.createElement as any).mock.results[0].value;
		expect(mockLink.setAttribute).toHaveBeenCalledWith(
			"download",
			expect.stringMatching(/^renault_system_all_data_.*\.csv$/),
		);
		expect(mockLink.click).toHaveBeenCalledOnce();

		expect(lastCsvContent).toContain("Alice");
		expect(lastCsvContent).toContain("Charlie");
		expect(lastCsvContent).not.toContain("Bob");
	});

	it("loads every stage for a system export instead of relying on loaded grid cache", async () => {
		const fetchStageRows = vi.fn(async (stage) => [
			{ ...mockData[0], id: `row-${stage}`, stage },
		]);

		const rows = await fetchAllRowsForExport(fetchStageRows);

		expect(fetchStageRows).toHaveBeenCalledTimes(ORDER_STAGES.length);
		expect(fetchStageRows).toHaveBeenNthCalledWith(1, "orders");
		expect(rows.map((row) => row.stage)).toEqual(ORDER_STAGES);
	});

	it("should export only Zeekr rows when Zeekr is selected", () => {
		exportAllSystemDataCSV(mockData, "Zeekr");

		// biome-ignore lint/suspicious/noExplicitAny: Test mock access
		const mockLink = (document.createElement as any).mock.results[0].value;
		expect(mockLink.setAttribute).toHaveBeenCalledWith(
			"download",
			expect.stringMatching(/^zeekr_system_all_data_.*\.csv$/),
		);
		expect(mockLink.click).toHaveBeenCalledOnce();

		expect(lastCsvContent).toContain("Bob");
		expect(lastCsvContent).not.toContain("Alice");
		expect(lastCsvContent).not.toContain("Charlie");
	});

	it("should exit early and not export if filter yields zero rows", () => {
		exportAllSystemDataCSV([], "Renault");
		expect(document.createElement).not.toHaveBeenCalled();
	});

	it("should include freeze rows labelled as 'FREEZE' in export output", () => {
		const freezeRow: PendingRow = {
			...mockData[0],
			id: "freeze-1",
			stage: "freeze",
			customerName: "FrozenCustomer",
		};
		exportAllSystemDataCSV([freezeRow], "Renault");

		expect(lastCsvContent).toContain('"FREEZE"');
		expect(lastCsvContent).toContain('"FrozenCustomer"');
	});

	it("should label archive rows as 'Archive' in export output", () => {
		const archiveRow: PendingRow = {
			...mockData[0],
			id: "archive-1",
			stage: "archive",
			customerName: "ArchiveCustomer",
			archiveReason: "Completed repair",
			archivedAt: "2026-09-01",
		};
		exportAllSystemDataCSV([archiveRow], "Renault");

		expect(lastCsvContent).toContain('"Archive"');
		expect(lastCsvContent).toContain('"ArchiveCustomer"');
		expect(lastCsvContent).toContain('"Completed repair"');
		expect(lastCsvContent).toContain('"2026-09-01"');
	});

	it("should include archiveReason, archivedAt, freezeReason, and frozenAt in headers", () => {
		exportAllSystemDataCSV([mockData[0]], "Renault");

		const headerLine = lastCsvContent.split("\n")[0];
		expect(headerLine).toContain("archiveReason");
		expect(headerLine).toContain("archivedAt");
		expect(headerLine).toContain("freezeReason");
		expect(headerLine).toContain("frozenAt");
	});

	it("should populate freezeReason and frozenAt from direct properties or metadata in CSV output", () => {
		const rowWithDirectFreeze: PendingRow & {
			freezeReason?: string;
			frozenAt?: string;
		} = {
			...mockData[0],
			id: "freeze-direct",
			stage: "freeze",
			customerName: "DirectFreezeUser",
			freezeReason: "Awaiting customer approval",
			frozenAt: "2026-09-14T10:00:00Z",
		};

		exportAllSystemDataCSV([rowWithDirectFreeze], "Renault");
		expect(lastCsvContent).toContain('"Awaiting customer approval"');
		expect(lastCsvContent).toContain('"2026-09-14T10:00:00Z"');

		const rowWithMetaFreeze: PendingRow & {
			metadata?: { freezeReason?: string; frozenAt?: string };
		} = {
			...mockData[0],
			id: "freeze-meta",
			stage: "freeze",
			customerName: "MetaFreezeUser",
			metadata: {
				freezeReason: "Parts on backorder",
				frozenAt: "2026-09-12",
			},
		};

		exportAllSystemDataCSV([rowWithMetaFreeze], "Renault");
		expect(lastCsvContent).toContain('"Parts on backorder"');
		expect(lastCsvContent).toContain('"2026-09-12"');
	});

	describe("CSV formula injection (#252)", () => {
		it("prefixes =, +, -, @ leading chars with a single quote", () => {
			expect(sanitizeCsvField('=HYPERLINK("http://evil","click")')).toBe(
				'\'=HYPERLINK("http://evil","click")',
			);
			expect(sanitizeCsvField("+2+3")).toBe("'+2+3");
			expect(sanitizeCsvField("-2+3")).toBe("'-2+3");
			expect(sanitizeCsvField("@malicious")).toBe("'@malicious");
		});

		it("leaves normal text, numbers, and empty values untouched", () => {
			expect(sanitizeCsvField("Brake pad")).toBe("Brake pad");
			expect(sanitizeCsvField(" =not-leading")).toBe(" =not-leading");
			expect(sanitizeCsvField("a=b")).toBe("a=b");
			expect(sanitizeCsvField(42)).toBe("42");
			expect(sanitizeCsvField(null)).toBe("");
			expect(sanitizeCsvField(undefined)).toBe("");
		});

		it("neutralizes formula payloads in exported CSV output", () => {
			const maliciousRow: PendingRow = {
				...mockData[0],
				id: "formula-1",
				customerName: '=HYPERLINK("http://evil","click")',
				description: "+2+3",
				partNumber: "-2+3",
				requester: "@malicious",
			};
			exportAllSystemDataCSV([maliciousRow], "Renault");

			expect(lastCsvContent.startsWith("\uFEFF")).toBe(true);
			expect(lastCsvContent).toContain("\"'=HYPERLINK");
			expect(lastCsvContent).toContain('"\'+2+3"');
			expect(lastCsvContent).toContain('"\'-2+3"');
			expect(lastCsvContent).toContain('"\'@malicious"');
			expect(lastCsvContent).not.toContain('"=HYPERLINK');
		});

		it("does not add a quote prefix to normal exported text", () => {
			const normalRow: PendingRow = {
				...mockData[0],
				id: "normal-1",
				customerName: "Alice",
				description: "Brake pad",
			};
			exportAllSystemDataCSV([normalRow], "Renault");

			expect(lastCsvContent).toContain('"Alice"');
			expect(lastCsvContent).toContain('"Brake pad"');
			expect(lastCsvContent).not.toContain("'Alice");
			expect(lastCsvContent).not.toContain("'Brake pad");
		});
	});
});
