import { describe, expect, it } from "vitest";
import {
	buildEmailTableClipboard,
	buildEmailTableHtml,
	buildEmailTableText,
	EMAIL_TABLE_HEADERS,
	type EmailTableRow,
} from "@/lib/clipboard/emailTable";

const row = (overrides: Partial<EmailTableRow> = {}): EmailTableRow => ({
	customerName: "Ahmed Hassan",
	vin: "VF1BB0A0F12345678",
	model: "Clio",
	partNumber: "0012345",
	description: "Front brake pads",
	...overrides,
});

const parseHtml = (html: string) =>
	new DOMParser().parseFromString(html, "text/html");

describe("email table clipboard builder", () => {
	it("uses the fixed five headers in the specified order", () => {
		expect(EMAIL_TABLE_HEADERS).toEqual([
			"Customer Name",
			"VIN",
			"Model",
			"Part Number",
			"Description",
		]);

		const doc = parseHtml(buildEmailTableHtml([row()]));
		const headers = Array.from(doc.querySelectorAll("thead th")).map(
			(cell) => cell.textContent,
		);
		expect(headers).toEqual([...EMAIL_TABLE_HEADERS]);
	});

	it("renders exactly one five-cell row per input row", () => {
		const doc = parseHtml(
			buildEmailTableHtml([
				row({ vin: "VIN-A", partNumber: "A-1" }),
				row({ vin: "VIN-A", partNumber: "A-2" }),
				row({ vin: "VIN-B", partNumber: "B-1" }),
			]),
		);

		const rows = doc.querySelectorAll("tbody tr");
		expect(rows).toHaveLength(3);
		for (const tableRow of Array.from(rows)) {
			expect(tableRow.querySelectorAll("td")).toHaveLength(5);
		}
		expect(
			Array.from(rows).map((tableRow) =>
				Array.from(tableRow.querySelectorAll("td")).map(
					(cell) => cell.textContent,
				),
			),
		).toEqual([
			["Ahmed Hassan", "VIN-A", "Clio", "A-1", "Front brake pads"],
			["Ahmed Hassan", "VIN-A", "Clio", "A-2", "Front brake pads"],
			["Ahmed Hassan", "VIN-B", "Clio", "B-1", "Front brake pads"],
		]);
	});

	it("keeps blank values as empty aligned cells", () => {
		const doc = parseHtml(
			buildEmailTableHtml([
				row({
					customerName: "",
					vin: "",
					model: "",
					partNumber: "",
					description: "",
				}),
			]),
		);

		const cells = doc.querySelectorAll("tbody td");
		expect(cells).toHaveLength(5);
		for (const cell of Array.from(cells)) {
			expect(cell.textContent).toBe("");
		}
	});

	it("preserves leading zeroes and identifier text", () => {
		const { text } = buildEmailTableClipboard([
			row({ vin: "01234567890123456", partNumber: "0000123" }),
		]);

		expect(text).toContain("01234567890123456");
		expect(text).toContain("0000123");
	});

	it("preserves Arabic alongside Latin identifiers", () => {
		const { html, text } = buildEmailTableClipboard([
			row({
				customerName: "أحمد حسن",
				description: "وسائد فرامل أمامية",
			}),
		]);

		expect(text).toContain("أحمد حسن");
		expect(text).toContain("وسائد فرامل أمامية");
		expect(html).toContain("أحمد حسن");
		expect(html).toContain("وسائد فرامل أمامية");
	});

	it("renders markup characters as literal text", () => {
		const doc = parseHtml(
			buildEmailTableHtml([
				row({
					customerName: '<script>alert("x")</script>',
					description: "A & B < C > D",
				}),
			]),
		);

		const cells = doc.querySelectorAll("tbody td");
		expect(cells[0].textContent).toBe('<script>alert("x")</script>');
		expect(cells[4].textContent).toBe("A & B < C > D");
		expect(doc.querySelector("script")).toBeNull();
	});

	it("preserves newlines as escaped line breaks in HTML cells", () => {
		const doc = parseHtml(
			buildEmailTableHtml([
				row({
					customerName: "Line one\nLine two",
					description: "A <tag>\r\nB & C",
				}),
			]),
		);

		const cells = doc.querySelectorAll("tbody td");
		expect(cells[0].querySelectorAll("br")).toHaveLength(1);
		expect(cells[0].innerHTML).toBe("Line one<br>Line two");
		expect(cells[0].getAttribute("dir")).toBe("auto");
		expect(cells[4].innerHTML).toContain("A &lt;tag&gt;<br>B &amp; C");
		expect(doc.querySelector("tag")).toBeNull();
	});

	it("uses a left-to-right layout with per-value text directions", () => {
		const doc = parseHtml(buildEmailTableHtml([row()]));

		expect(doc.querySelector("table")?.getAttribute("dir")).toBe("ltr");
		const cells = doc.querySelectorAll("tbody td");
		expect(cells[0].getAttribute("dir")).toBe("auto");
		expect(cells[1].getAttribute("dir")).toBe("ltr");
		expect(cells[2].getAttribute("dir")).toBe("auto");
		expect(cells[3].getAttribute("dir")).toBe("ltr");
		expect(cells[4].getAttribute("dir")).toBe("auto");
	});

	it("puts a visible border and centered alignment on every header and data cell", () => {
		const doc = parseHtml(buildEmailTableHtml([row()]));
		const cells = [
			...Array.from(doc.querySelectorAll("thead th")),
			...Array.from(doc.querySelectorAll("tbody td")),
		];

		expect(cells).toHaveLength(10);
		for (const cell of cells) {
			const style = cell.getAttribute("style") ?? "";
			expect(style).toContain("border:1px solid");
			expect(style).toContain("text-align:center");
			expect(style).toContain("vertical-align:middle");
		}
	});

	it("provides a tab-separated plain-text representation of the same data", () => {
		const text = buildEmailTableText([
			row({ customerName: "One", vin: "VIN-1" }),
			row({ customerName: "Two", vin: "VIN-2" }),
		]);

		expect(text.split("\n")).toEqual([
			"Customer Name\tVIN\tModel\tPart Number\tDescription",
			"One\tVIN-1\tClio\t0012345\tFront brake pads",
			"Two\tVIN-2\tClio\t0012345\tFront brake pads",
		]);
	});
});
