export interface EmailTableRow {
	customerName: string;
	vin: string;
	model: string;
	partNumber: string;
	description: string;
}

type EmailTableColumn = {
	header: string;
	key: keyof EmailTableRow;
	direction: "ltr" | "auto";
};

export const EMAIL_TABLE_COLUMNS: readonly EmailTableColumn[] = [
	{ header: "Customer Name", key: "customerName", direction: "auto" },
	{ header: "VIN", key: "vin", direction: "ltr" },
	{ header: "Model", key: "model", direction: "auto" },
	{ header: "Part Number", key: "partNumber", direction: "ltr" },
	{ header: "Description", key: "description", direction: "auto" },
];

export const EMAIL_TABLE_HEADERS = EMAIL_TABLE_COLUMNS.map(
	(column) => column.header,
);

const CELL_STYLE =
	"border:1px solid #000000;padding:4px 8px;text-align:center;vertical-align:middle;font-family:Calibri,Arial,sans-serif;font-size:11pt;";

const escapeHtml = (value: string): string =>
	value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");

const renderCellHtml = (value: string): string =>
	escapeHtml(value).replace(/\r\n?|\n/g, "<br>");

export function buildEmailTableHtml(rows: readonly EmailTableRow[]): string {
	const headerCells = EMAIL_TABLE_COLUMNS.map(
		(column) =>
			`<th dir="ltr" style="${CELL_STYLE}">${escapeHtml(column.header)}</th>`,
	).join("");

	const bodyRows = rows
		.map((row) => {
			const cells = EMAIL_TABLE_COLUMNS.map(
				(column) =>
					`<td dir="${column.direction}" style="${CELL_STYLE}">${renderCellHtml(
						row[column.key] ?? "",
					)}</td>`,
			).join("");
			return `<tr>${cells}</tr>`;
		})
		.join("");

	return `<table dir="ltr" border="1" cellpadding="0" cellspacing="0" style="border-collapse:collapse;direction:ltr;"><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table>`;
}

export function buildEmailTableText(rows: readonly EmailTableRow[]): string {
	const line = (values: readonly string[]) => values.join("\t");
	const header = line(EMAIL_TABLE_HEADERS);
	const body = rows.map((row) =>
		line(EMAIL_TABLE_COLUMNS.map((column) => row[column.key] ?? "")),
	);
	return [header, ...body].join("\n");
}

export function buildEmailTableClipboard(rows: readonly EmailTableRow[]): {
	html: string;
	text: string;
} {
	return {
		html: buildEmailTableHtml(rows),
		text: buildEmailTableText(rows),
	};
}
