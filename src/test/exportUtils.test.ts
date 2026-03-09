import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { exportAllSystemDataCSV } from "../lib/exportUtils";
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

	it("should export only Zeekr rows when Zeekr is selected", () => {
		exportAllSystemDataCSV(mockData, "Zeekr");

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
});
