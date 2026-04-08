#!/usr/bin/env node

/**
 * One-time import script: "sys data - Sheet1.csv" → Supabase orders (stage: "main")
 *
 * Usage:
 *   npm run import:sheet          # dry-run (no writes, just preview)
 *   npm run import:sheet -- --yes # actually insert into Supabase
 *
 * Requires .env.local with:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// 1. Load .env.local
// ---------------------------------------------------------------------------
function loadEnvFile(filePath) {
	try {
		const content = readFileSync(filePath, "utf8");
		for (const line of content.split("\n")) {
			const trimmed = line.trim();
			if (!trimmed || trimmed.startsWith("#")) continue;
			const eqIdx = trimmed.indexOf("=");
			if (eqIdx === -1) continue;
			const key = trimmed.slice(0, eqIdx).trim();
			const value = trimmed
				.slice(eqIdx + 1)
				.trim()
				.replace(/^["']|["']$/g, "");
			if (key && !process.env[key]) {
				process.env[key] = value;
			}
		}
	} catch {
		// .env.local not found — rely on real env vars
	}
}

loadEnvFile(resolve(process.cwd(), ".env.local"));

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
	console.error(
		"❌  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
	);
	process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// ---------------------------------------------------------------------------
// 2. CSV parser (handles quoted fields with embedded newlines)
// ---------------------------------------------------------------------------
function parseCSV(text) {
	const rows = [];
	let currentRow = [];
	let currentField = "";
	let inQuotes = false;

	for (let i = 0; i < text.length; i++) {
		const ch = text[i];
		const next = text[i + 1];

		if (inQuotes) {
			if (ch === '"' && next === '"') {
				// escaped quote
				currentField += '"';
				i++;
			} else if (ch === '"') {
				inQuotes = false;
			} else {
				currentField += ch;
			}
		} else {
			if (ch === '"') {
				inQuotes = true;
			} else if (ch === ",") {
				currentRow.push(currentField.trim());
				currentField = "";
			} else if (ch === "\r" && next === "\n") {
				currentRow.push(currentField.trim());
				rows.push(currentRow);
				currentRow = [];
				currentField = "";
				i++; // skip \n
			} else if (ch === "\n") {
				currentRow.push(currentField.trim());
				rows.push(currentRow);
				currentRow = [];
				currentField = "";
			} else {
				currentField += ch;
			}
		}
	}

	// flush last field/row
	if (currentField || currentRow.length > 0) {
		currentRow.push(currentField.trim());
		rows.push(currentRow);
	}

	return rows;
}

// ---------------------------------------------------------------------------
// 3. Column indices (0-based, after the multi-line header is parsed as one row)
// ---------------------------------------------------------------------------
const COL = {
	rDate: 0,
	customerName: 1,
	company: 2,
	vin: 3,
	mobile: 4,
	cntrRdg: 5,
	sabNumber: 6,
	acceptedBy: 7,
	model: 8,
	startWarranty: 9,
	remainTime: 10,
	// col 11 and 12 are unnamed Excel date serials — skip
	endWarranty: 13,
	partNumber: 14,
	description: 15,
	repairSystem: 16,
	requester: 17,
};

function normalizeCompany(raw) {
	const lower = (raw || "").toLowerCase().trim();
	if (lower.includes("renualt") || lower.includes("renault")) return "Renault";
	if (lower.includes("zeekr")) return "Zeekr";
	return raw || "";
}

function get(row, col) {
	return (row[col] ?? "").trim();
}

// ---------------------------------------------------------------------------
// 4. Parse CSV file and group rows by SAB number
// ---------------------------------------------------------------------------
const CSV_PATH = resolve(process.cwd(), "sys data - Sheet1.csv");
let csvText;
try {
	csvText = readFileSync(CSV_PATH, "utf8");
} catch {
	console.error(`❌  Cannot read CSV: ${CSV_PATH}`);
	process.exit(1);
}

const allRows = parseCSV(csvText);

// The header spans 3 physical lines that get collapsed into 1 row by the parser
// because of the quoted newlines. Skip 1 row (the header row).
const dataRows = allRows.slice(1).filter((row) => row.length >= 17);

// Group by SAB number
const groups = new Map();
for (const row of dataRows) {
	const sab = get(row, COL.sabNumber);
	if (!sab) continue;

	if (!groups.has(sab)) {
		groups.set(sab, []);
	}
	groups.get(sab).push(row);
}

// ---------------------------------------------------------------------------
// 5. Build order objects
// ---------------------------------------------------------------------------
const orders = [];
const skipped = [];

for (const [sab, rows] of groups) {
	const first = rows[0];

	const customerName = get(first, COL.customerName);
	const vin = get(first, COL.vin);

	if (!customerName || !vin) {
		skipped.push({ sab, reason: "missing customerName or vin" });
		continue;
	}

	const parts = rows.map((row) => ({
		id: randomUUID(),
		partNumber: get(row, COL.partNumber),
		description: get(row, COL.description),
		rowId: "",
	}));

	const company = normalizeCompany(get(first, COL.company));
	const mobile = String(get(first, COL.mobile));
	const cntrRdg = Number(get(first, COL.cntrRdg)) || 0;
	const model = get(first, COL.model);
	const rDate = get(first, COL.rDate);
	const acceptedBy = get(first, COL.acceptedBy);
	const requester = get(first, COL.requester);
	const repairSystem = get(first, COL.repairSystem);
	const startWarranty = get(first, COL.startWarranty);
	const endWarranty = get(first, COL.endWarranty);
	const remainTime = get(first, COL.remainTime);

	orders.push({
		id: randomUUID(),
		stage: "main",
		order_number: null,
		customer_name: customerName,
		customer_phone: mobile,
		vin,
		company,
		status: "Pending",
		metadata: {
			customerName,
			mobile,
			vin,
			company,
			model,
			cntrRdg,
			sabNumber: sab,
			acceptedBy,
			requester,
			repairSystem,
			startWarranty,
			endWarranty,
			remainTime,
			rDate,
			status: "Pending",
			stage: "main",
			parts,
			// legacy single-part fields (synced from parts[0])
			partNumber: parts[0]?.partNumber ?? "",
			description: parts[0]?.description ?? "",
		},
	});
}

// ---------------------------------------------------------------------------
// 6. Dry-run preview
// ---------------------------------------------------------------------------
const isDryRun = !process.argv.includes("--yes");

console.log("\n======================================");
console.log("  Sheet Import — Main Stage");
console.log("======================================");
console.log(`CSV rows read  : ${dataRows.length}`);
console.log(`Unique SABs    : ${groups.size}`);
console.log(`Orders to insert: ${orders.length}`);
console.log(`Skipped        : ${skipped.length}`);

if (skipped.length > 0) {
	console.log("\n⚠️  Skipped SABs:");
	for (const s of skipped) {
		console.log(`   SAB ${s.sab} — ${s.reason}`);
	}
}

console.log("\n--- Preview (first 10 orders) ---");
const preview = orders.slice(0, 10);
for (const o of preview) {
	const m = o.metadata;
	const partsCount = m.parts.length;
	console.log(
		`  SAB ${m.sabNumber.padEnd(13)} | ${o.customer_name.slice(0, 30).padEnd(30)} | VIN ${o.vin} | ${partsCount} part(s) | ${m.rDate}`,
	);
}
if (orders.length > 10) {
	console.log(`  ... and ${orders.length - 10} more`);
}

if (isDryRun) {
	console.log(
		"\n🔍  DRY RUN — no data was written. Run with --yes to insert:\n",
	);
	console.log("   npm run import:sheet -- --yes\n");
	process.exit(0);
}

// ---------------------------------------------------------------------------
// 7. Batch insert into Supabase
// ---------------------------------------------------------------------------
console.log("\n⏳  Inserting orders into Supabase...");

const BATCH_SIZE = 50;
let inserted = 0;
let failed = 0;

for (let i = 0; i < orders.length; i += BATCH_SIZE) {
	const batch = orders.slice(i, i + BATCH_SIZE);
	const { error } = await supabase.from("orders").insert(batch);
	if (error) {
		console.error(
			`❌  Batch ${Math.floor(i / BATCH_SIZE) + 1} failed: ${error.message}`,
		);
		failed += batch.length;
	} else {
		inserted += batch.length;
		console.log(
			`   ✅  Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} orders inserted`,
		);
	}
}

console.log(`\n✅  Done. Inserted: ${inserted}  Failed: ${failed}\n`);
