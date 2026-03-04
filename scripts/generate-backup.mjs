import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

// [CRITICAL] PROTECTED FILE - DO NOT MODIFY WITHOUT REVIEW
// This script handles data backup and email reporting.
// Logic: Fetch orders -> Generate CSV -> SMTP Email -> Update Settings
// Maintainer: System Admin

// Configuration from environment variables
const SUPABASE_URL =
	process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// SMTP Configuration
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number.parseInt(process.env.SMTP_PORT || "587", 10);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

const missingVars = [];
if (!SUPABASE_URL) missingVars.push("SUPABASE_URL");
if (!SUPABASE_SERVICE_ROLE_KEY) missingVars.push("SUPABASE_SERVICE_ROLE_KEY");
if (!SMTP_HOST) missingVars.push("SMTP_HOST");
if (!SMTP_USER) missingVars.push("SMTP_USER");
if (!SMTP_PASS) missingVars.push("SMTP_PASS");

if (missingVars.length > 0) {
	console.error(
		`Missing required environment variables: ${missingVars.join(", ")}`,
	);
	process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * Helper to get current time in Cairo (UTC+2)
 */
function getCairoDate() {
	const now = new Date();
	// Use Intl to format the date in Cairo timezone
	const formatter = new Intl.DateTimeFormat("en-US", {
		timeZone: "Africa/Cairo",
		year: "numeric",
		month: "numeric",
		day: "numeric",
		weekday: "long",
	});

	const parts = formatter.formatToParts(now);
	const dateMap = {};
	for (const part of parts) {
		dateMap[part.type] = part.value;
	}

	return {
		day: Number.parseInt(dateMap.day),
		month: Number.parseInt(dateMap.month),
		year: Number.parseInt(dateMap.year),
		weekday: dateMap.weekday, // e.g., "Monday"
	};
}

/**
 * Parses and validates Weekly-X format.
 * @param {string} frequency - Frequency string like "Weekly-2"
 * @returns {number|null} Day index (0-6) or null if invalid
 */
function parseWeeklyDayIndex(frequency) {
	const parts = frequency.split("-");
	const dayIndex = Number.parseInt(parts[1]);

	if (Number.isNaN(dayIndex) || dayIndex < 0 || dayIndex > 6) {
		console.error(
			`Invalid Weekly format: ${frequency}. Expected "Weekly-0" to "Weekly-6". Skipping.`,
		);
		return null;
	}

	return dayIndex;
}

/**
 * Checks if schedule matches specific weekly day.
 * @param {string} dayName - Target day name
 * @param {string} todayName - Today's day name
 * @param {number} dayIndex - Day index for logging
 * @returns {boolean}
 */
function checkWeeklyMatch(dayName, todayName, dayIndex) {
	const shouldProcess = todayName === dayName;
	console.log(
		`Weekly schedule: Selected ${dayName} (index ${dayIndex}), Today is ${todayName}. Run: ${shouldProcess}`,
	);
	return shouldProcess;
}

/**
 * Checks if schedule matches target date (day and/or month).
 * @param {number} targetDay - Target day of month
 * @param {number} currentDay - Current day of month
 * @param {number} targetMonth - Target month (optional)
 * @param {number} currentMonth - Current month (optional)
 * @param {string} label - Log label
 * @returns {boolean}
 */
function checkDateMatch(
	targetDay,
	currentDay,
	targetMonth,
	currentMonth,
	label,
) {
	const shouldProcess =
		currentDay === targetDay &&
		(targetMonth === undefined || currentMonth === targetMonth);
	console.log(`${label}: Run: ${shouldProcess}`);
	return shouldProcess;
}

/**
 * Validates if the backup should run today based on settings and schedule.
 * @param {object} settings - Report settings from database
 * @param {boolean} isScheduleRun - Whether this is a triggered schedule run
 * @returns {boolean}
 */
function shouldRunToday(settings, isScheduleRun) {
	if (!isScheduleRun) return true;

	if (!settings.is_enabled) {
		console.log("Backup is disabled. Skipping scheduled run.");
		return false;
	}

	const cairo = getCairoDate();
	console.log("Current Cairo Time:", cairo);

	const frequency = settings.frequency || "Weekly";
	const dayNames = [
		"Sunday",
		"Monday",
		"Tuesday",
		"Wednesday",
		"Thursday",
		"Friday",
		"Saturday",
	];

	if (frequency === "Daily") {
		console.log("Daily schedule: Running backup.");
		return true;
	}

	if (frequency.startsWith("Weekly-")) {
		const dayIndex = parseWeeklyDayIndex(frequency);
		if (dayIndex === null) return false;
		return checkWeeklyMatch(dayNames[dayIndex], cairo.weekday, dayIndex);
	}

	if (frequency === "Weekly") {
		return checkWeeklyMatch("Monday", cairo.weekday, 1);
	}

	if (frequency === "Monthly") {
		return checkDateMatch(
			1,
			cairo.day,
			undefined,
			undefined,
			"Monthly schedule: Run on 1st. Today is " + cairo.day + ".",
		);
	}

	if (frequency === "Yearly") {
		return checkDateMatch(
			1,
			cairo.day,
			1,
			cairo.month,
			`Yearly schedule: Run on Jan 1st. Today is ${cairo.month}/${cairo.day}.`,
		);
	}

	console.error(`Unknown frequency format: ${frequency}. Skipping.`);
	return false;
}

/**
 * Maps raw database orders to the flat structure required for CSV.
 * @param {Array} rawOrders - Orders fetched from Supabase
 * @returns {Array} Mapped data
 */
function processOrders(rawOrders) {
	const stageMap = {
		orders: "Orders",
		main: "Main Sheet",
		booking: "Booking",
		call: "Call List",
		archive: "Archive",
	};

	const mappedData = [];

	for (const row of rawOrders) {
		let reminderDate = "";
		let reminderTime = "";
		let reminderSubject = "";
		let reminderStatus = "None";

		if (
			row.order_reminders &&
			Array.isArray(row.order_reminders) &&
			row.order_reminders.length > 0
		) {
			const active = row.order_reminders.find((r) => !r.is_completed);
			const primary = active || row.order_reminders[0];

			if (primary && primary.remind_at) {
				const d = new Date(primary.remind_at);
				reminderDate = d.toISOString().split("T")[0];
				reminderTime = d.toTimeString().slice(0, 5);
				reminderSubject = primary.title || "";
				reminderStatus = primary.is_completed ? "Completed" : "Pending";
			}
		}

		const meta = row.metadata || {};
		const parts =
			meta.parts && Array.isArray(meta.parts) && meta.parts.length > 0
				? meta.parts
				: [
						{
							partNumber: meta.partNumber || "",
							description: meta.description || "",
						},
					];

		for (const part of parts) {
			mappedData.push({
				id: row.id || "",
				source: stageMap[row.stage] || row.stage || "Unknown",
				trackingId: row.order_number || "",
				vin: row.vin || "",
				status: row.status || "",
				customerName: row.customer_name || "",
				customerEmail: row.customer_email || "",
				customerPhone: row.customer_phone || "",
				company: row.company || "",
				partNumber: part.partNumber || "",
				partDescription: part.description || "",
				partStatus: meta.partStatus || "",
				model: meta.model || "",
				cntrRdg: meta.cntrRdg || 0,
				rDate: meta.rDate || "",
				requester: meta.requester || "",
				acceptedBy: meta.acceptedBy || "",
				sabNumber: meta.sabNumber || "",
				repairSystem: meta.repairSystem || "",
				startWarranty: meta.startWarranty || "",
				endWarranty: meta.endWarranty || "",
				remainTime: meta.remainTime || "",
				bookingDate: meta.bookingDate || "",
				bookingStatus: meta.bookingStatus || "",
				noteContent: meta.noteContent || "",
				actionNote: meta.actionNote || "",
				bookingNote: meta.bookingNote || "",
				reminderDate,
				reminderTime,
				reminderSubject,
				reminderStatus,
				archiveReason: meta.archiveReason || "",
				archivedAt: meta.archivedAt || "",
				createdAt: row.created_at || "",
				updatedAt: row.updated_at || "",
			});
		}
	}
	return mappedData;
}

/**
 * Sends the backup CSV via SMTP email.
 * @param {object} settings - Report settings
 * @param {Array} mappedData - Data records
 * @param {string} csvContent - Generated CSV content
 * @param {boolean} isScheduleRun - Whether this was a schedule run
 */
async function sendBackupEmail(
	settings,
	mappedData,
	csvContent,
	isScheduleRun,
) {
	const recipients = settings.emails || [];
	if (recipients.length === 0) {
		console.log("Recipients list is empty in settings. Skipping email.");
		return;
	}

	const dateStr = new Date().toISOString().split("T")[0];
	console.log(`Attempting to send email via SMTP to: ${recipients.join(", ")}`);

	const transporter = nodemailer.createTransport({
		host: SMTP_HOST,
		port: SMTP_PORT,
		secure: SMTP_PORT === 465,
		auth: {
			user: SMTP_USER,
			pass: SMTP_PASS,
		},
	});

	const mailOptions = {
		from: `"pendingsystem" <${SMTP_USER}>`,
		to: recipients.join(", "),
		subject: `[Backup] pendingsystem - ${dateStr}`,
		html: `
          <h1>Automatic Backup Report</h1>
          <p>This is an automated backup of your pendingsystem data.</p>
          <p><strong>Date (Cairo):</strong> ${new Date().toLocaleString("en-US", { timeZone: "Africa/Cairo" })}</p>
          <p><strong>Total Orders:</strong> ${mappedData.length}</p>
          <p><strong>Frequency:</strong> ${isScheduleRun ? settings.frequency : "Manual Trigger"}</p>
          <p>Please find the attached CSV file with all system information including notes and reminders.</p>
        `,
		attachments: [
			{
				filename: `backup_${dateStr}.csv`,
				content: csvContent,
			},
		],
	};

	const info = await transporter.sendMail(mailOptions);
	console.log("Email sent successfully:", info.messageId);
}

try {
	const isScheduleRun = process.env.IS_SCHEDULE_RUN === "true";
	console.log(`Starting backup process (Scheduled: ${isScheduleRun})...`);

	// 1. Fetch Report Settings
	const { data: settings, error: settingsError } = await supabase
		.from("report_settings")
		.select("*")
		.order("updated_at", { ascending: false })
		.limit(1)
		.maybeSingle();

	if (settingsError) throw settingsError;
	if (!settings) {
		console.log("No report settings found in database. Exiting.");
		process.exit(0);
	}

	// 2. Validate Schedule Condition
	if (!shouldRunToday(settings, isScheduleRun)) {
		process.exit(0);
	}

	// 3. Fetch Orders
	console.log("Fetching orders from database...");
	const { data: rawOrders, error: ordersError } = await supabase
		.from("orders")
		.select(`
            id, stage, order_number, customer_name, customer_email,
            customer_phone, vin, company, status, metadata,
            created_at, updated_at, order_reminders (*)
        `)
		.order("created_at", { ascending: false });

	if (ordersError) throw ordersError;
	if (!rawOrders || rawOrders.length === 0) {
		console.log("No orders found in database to backup.");
		process.exit(0);
	}

	// 4. Process and Generate CSV
	const mappedData = processOrders(rawOrders);
	const headers = [
		"id",
		"source",
		"trackingId",
		"vin",
		"status",
		"customerName",
		"customerEmail",
		"customerPhone",
		"company",
		"partNumber",
		"partDescription",
		"partStatus",
		"model",
		"cntrRdg",
		"rDate",
		"requester",
		"acceptedBy",
		"sabNumber",
		"repairSystem",
		"startWarranty",
		"endWarranty",
		"remainTime",
		"bookingDate",
		"bookingStatus",
		"noteContent",
		"actionNote",
		"bookingNote",
		"reminderDate",
		"reminderTime",
		"reminderSubject",
		"reminderStatus",
		"archiveReason",
		"archivedAt",
		"createdAt",
		"updatedAt",
	];

	console.log(`Generating CSV for ${mappedData.length} records...`);
	const csvContent = generateCSV(mappedData, headers);

	// 5. Send Email
	await sendBackupEmail(settings, mappedData, csvContent, isScheduleRun);

	// 6. Update last_sent_at
	console.log("Updating last_sent_at in database...");
	const { error: updateError } = await supabase
		.from("report_settings")
		.update({ last_sent_at: new Date().toISOString() })
		.eq("id", settings.id);

	if (updateError) {
		console.error("Error updating last_sent_at:", updateError);
	} else {
		console.log("Database updated with last_sent_at.");
	}
} catch (error) {
	console.error("CRITICAL: Backup process failed:");
	console.error(error);
	process.exit(1);
}

function generateCSV(data, headers) {
	if (data.length === 0) return "";
	const columnHeaders = headers || Object.keys(data[0]);
	const rows = [columnHeaders.join(",")];

	for (const item of data) {
		const values = columnHeaders.map((header) => {
			const val = item[header];
			if (val === null || val === undefined) return "";
			const stringVal =
				typeof val === "object" ? JSON.stringify(val) : String(val);
			if (
				stringVal.includes(",") ||
				stringVal.includes('"') ||
				stringVal.includes("\n")
			) {
				return `"${stringVal.replaceAll('"', '""')}"`;
			}
			return stringVal;
		});
		rows.push(values.join(","));
	}

	return "\uFEFF" + rows.join("\n");
}
