import { beforeEach, describe, expect, it, vi } from "vitest";
import { printReservationLabels } from "@/lib/printing/reservationLabels";
import type { PendingRow } from "@/types";

// Mock window.open and window.print
const mockWindowOpen = vi.fn();
const mockWindowPrint = vi.fn();
const mockWindowClose = vi.fn();

// Mock console methods to avoid noise in tests
const _mockConsoleError = vi
	.spyOn(console, "error")
	.mockImplementation(() => {});

describe("printReservationLabels", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Setup window mocks
		Object.defineProperty(window, "open", {
			value: mockWindowOpen,
			writable: true,
		});

		// Mock the print window object
		const mockPrintWindow = {
			document: {
				write: vi.fn(),
				close: vi.fn(),
			},
			print: mockWindowPrint,
			close: mockWindowClose,
			onload: null,
		};

		mockWindowOpen.mockReturnValue(mockPrintWindow as any);
	});

	it("should show alert when no items are selected", () => {
		const mockAlert = vi.spyOn(window, "alert").mockImplementation(() => {});

		printReservationLabels([]);

		expect(mockAlert).toHaveBeenCalledWith(
			"Please select items to print reservation labels.",
		);
		expect(mockWindowOpen).not.toHaveBeenCalled();

		mockAlert.mockRestore();
	});

	it("should handle window.open failure gracefully", () => {
		mockWindowOpen.mockReturnValue(null);

		printReservationLabels([createMockRow("test-id", "pendingsystem")]);

		// Should not throw error
		expect(mockWindowOpen).toHaveBeenCalled();
	});

	it("should generate correct branding for pendingsystem orders", () => {
		const renaultRow = createMockRow("1", "pendingsystem");
		printReservationLabels([renaultRow]);

		const mockDoc = mockWindowOpen.mock.results[0].value.document;
		const writtenContent = mockDoc.write.mock.calls[0][0];

		// Should contain pendingsystem logo
		expect(writtenContent).toContain('viewBox="0 0 136.45 178.6"');
		// Should contain PENDINGSYSTEM text
		expect(writtenContent).toContain(
			'<span class="brand">PENDINGSYSTEM</span>',
		);
		// Should NOT contain Zeekr logo
		expect(writtenContent).not.toContain('viewBox="0 0 115 29"');
	});

	it("should generate correct branding for Zeekr orders", () => {
		const zeekrRow = createMockRow("2", "Zeekr");
		printReservationLabels([zeekrRow]);

		const mockDoc = mockWindowOpen.mock.results[0].value.document;
		const writtenContent = mockDoc.write.mock.calls[0][0];

		// Should contain Zeekr logo
		expect(writtenContent).toContain('viewBox="0 0 115 29"');
		// Should NOT contain PENDINGSYSTEM text (removed for Zeekr)
		expect(writtenContent).not.toContain(
			'<span class="brand">PENDINGSYSTEM</span>',
		);
		// Should contain empty brand span for Zeekr
		expect(writtenContent).toContain('<span class="brand"></span>');
	});

	it("should handle case-insensitive company names", () => {
		const testCases = [
			{ company: "zeekr", expectedLogo: "zeekr" },
			{ company: "ZEEKR", expectedLogo: "zeekr" },
			{ company: "Zeekr", expectedLogo: "zeekr" },
			{ company: "reNault", expectedLogo: "renault" },
			{ company: "PENDINGSYSTEM", expectedLogo: "renault" },
			{ company: "pendingsystem", expectedLogo: "renault" },
		];

		testCases.forEach(({ company, expectedLogo }) => {
			vi.clearAllMocks();
			const row = createMockRow(`test-${company}`, company);
			printReservationLabels([row]);

			const mockDoc = mockWindowOpen.mock.results[0].value.document;
			const writtenContent = mockDoc.write.mock.calls[0][0];

			if (expectedLogo === "zeekr") {
				expect(writtenContent).toContain('viewBox="0 0 115 29"');
				expect(writtenContent).not.toContain(
					'<span class="brand">PENDINGSYSTEM</span>',
				);
			} else {
				expect(writtenContent).toContain('viewBox="0 0 136.45 178.6"');
				expect(writtenContent).toContain(
					'<span class="brand">PENDINGSYSTEM</span>',
				);
			}
		});
	});

	it("should default to pendingsystem branding when company is null/undefined", () => {
		const testCases = [
			createMockRow("null-company", null as any),
			createMockRow("undefined-company", undefined as any),
			createMockRow("empty-company", ""),
		];

		testCases.forEach((row) => {
			vi.clearAllMocks();
			printReservationLabels([row]);

			const mockDoc = mockWindowOpen.mock.results[0].value.document;
			const writtenContent = mockDoc.write.mock.calls[0][0];

			// Should default to pendingsystem branding
			expect(writtenContent).toContain('viewBox="0 0 136.45 178.6"');
			expect(writtenContent).toContain(
				'<span class="brand">PENDINGSYSTEM</span>',
			);
		});
	});

	it("should handle mixed company types in single print job", () => {
		const rows = [
			createMockRow("1", "pendingsystem"),
			createMockRow("2", "Zeekr"),
			createMockRow("3", "ZEEKR"),
			createMockRow("4", "renault"),
		];

		printReservationLabels(rows);

		const mockDoc = mockWindowOpen.mock.results[0].value.document;
		const writtenContent = mockDoc.write.mock.calls[0][0];

		// Should contain both logos
		expect(writtenContent).toContain('viewBox="0 0 136.45 178.6"'); // pendingsystem
		expect(writtenContent).toContain('viewBox="0 0 115 29"'); // Zeekr

		// Should have PENDINGSYSTEM text for pendingsystem orders
		const renaultBrandCount = (
			writtenContent.match(/<span class="brand">PENDINGSYSTEM<\/span>/g) || []
		).length;
		expect(renaultBrandCount).toBe(2); // Two pendingsystem orders

		// Should have empty brand spans for Zeekr orders
		const emptyBrandCount = (
			writtenContent.match(/<span class="brand"><\/span>/g) || []
		).length;
		expect(emptyBrandCount).toBe(2); // Two Zeekr orders
	});

	it("should include all required label content", () => {
		const row = createMockRow("test", "Zeekr", {
			customerName: "John Doe",
			description: "Test Part",
			vin: "1234567890",
			partNumber: "PART-001",
		});

		printReservationLabels([row]);

		const mockDoc = mockWindowOpen.mock.results[0].value.document;
		const writtenContent = mockDoc.write.mock.calls[0][0];

		// Check customer information
		expect(writtenContent).toContain("John Doe");
		expect(writtenContent).toContain("Test Part");
		expect(writtenContent).toContain("1234567890");
		expect(writtenContent).toContain("PART-001");

		// Check Arabic labels
		expect(writtenContent).toContain("اسم العميل");
		expect(writtenContent).toContain("اسم القطعة");
		expect(writtenContent).toContain("رقم الشاسيه");
		expect(writtenContent).toContain("رقم القطعة");
		expect(writtenContent).toContain("قطعة غيار محجوزة");

		// Check date format
		const today = new Date().toLocaleDateString("en-GB");
		expect(writtenContent).toContain(today);
	});

	it("should handle missing optional fields gracefully", () => {
		const row = createMockRow("minimal", "pendingsystem");

		printReservationLabels([row]);

		const mockDoc = mockWindowOpen.mock.results[0].value.document;
		const writtenContent = mockDoc.write.mock.calls[0][0];

		// Should use fallback values (-) for missing fields
		expect(writtenContent).toContain(
			'<div class="field-value large-text">-</div>',
		);
		expect(writtenContent).toContain('<div class="field-value">-</div>');
		expect(writtenContent).toContain(
			'<div class="field-value vin-text">-</div>',
		);
		expect(writtenContent).toContain(
			'<div class="field-value mono-text">-</div>',
		);
	});

	it("should generate valid HTML structure", () => {
		const row = createMockRow("html-test", "Zeekr");
		printReservationLabels([row]);

		const mockDoc = mockWindowOpen.mock.results[0].value.document;
		const writtenContent = mockDoc.write.mock.calls[0][0];

		// Check HTML structure
		expect(writtenContent).toContain("<!DOCTYPE html>");
		expect(writtenContent).toContain('<html dir="rtl">');
		expect(writtenContent).toContain("<head>");
		expect(writtenContent).toContain("<body>");
		expect(writtenContent).toContain('<div class="grid-container">');
		expect(writtenContent).toContain('<div class="label-box">');
		expect(writtenContent).toContain('<div class="header">');
		expect(writtenContent).toContain('<div class="header-left">');
		expect(writtenContent).toContain('<div class="header-right">');

		// Check CSS is included
		expect(writtenContent).toContain("@page { margin: 1cm; size: A4; }");
		expect(writtenContent).toContain(".label-box {");
		expect(writtenContent).toContain(".logo {");
		expect(writtenContent).toContain(".brand {");

		// Check print script
		expect(writtenContent).toContain("window.onload");
		expect(writtenContent).toContain("window.print()");
		expect(writtenContent).toContain("window.close()");
	});
});

// Helper function to create mock PendingRow objects
function createMockRow(
	id: string,
	company: string | null,
	overrides: Partial<PendingRow> = {},
): PendingRow {
	return {
		id,
		baseId: "",
		trackingId: "",
		customerName: "",
		company,
		vin: "",
		mobile: "",
		cntrRdg: 0,
		model: "",
		parts: [],
		sabNumber: "",
		acceptedBy: "",
		requester: "",
		requestedBy: "",
		partStatus: "",
		partNumber: "",
		description: "",
		status: "Pending",
		rDate: "",
		repairSystem: "",
		startWarranty: "",
		endWarranty: "",
		remainTime: "",
		noteContent: "",
		actionNote: "",
		bookingDate: "",
		bookingNote: "",
		bookingStatus: "",
		hasAttachment: false,
		attachmentPath: "",
		archiveReason: "",
		archivedAt: "",
		sourceType: "",
		stage: "",
		...overrides,
	};
}
