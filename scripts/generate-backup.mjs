import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

// [CRITICAL] PROTECTED FILE - DO NOT MODIFY WITHOUT REVIEW
// This script handles data backup and email reporting.
// Logic: Fetch orders -> Generate CSV -> SMTP Email -> Update Settings
// Maintainer: System Admin

// Configuration from environment variables
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// SMTP Configuration
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

const missingVars = [];
if (!SUPABASE_URL) missingVars.push('SUPABASE_URL');
if (!SUPABASE_SERVICE_ROLE_KEY) missingVars.push('SUPABASE_SERVICE_ROLE_KEY');
if (!SMTP_HOST) missingVars.push('SMTP_HOST');
if (!SMTP_USER) missingVars.push('SMTP_USER');
if (!SMTP_PASS) missingVars.push('SMTP_PASS');

if (missingVars.length > 0) {
    console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * Helper to get current time in Cairo (UTC+2)
 */
function getCairoDate() {
    const now = new Date();
    // Use Intl to format the date in Cairo timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Africa/Cairo',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        weekday: 'long',
    });

    const parts = formatter.formatToParts(now);
    const dateMap = {};
    for (const part of parts) {
        dateMap[part.type] = part.value;
    }

    return {
        day: parseInt(dateMap.day),
        month: parseInt(dateMap.month),
        year: parseInt(dateMap.year),
        weekday: dateMap.weekday, // e.g., "Monday"
    };
}

async function runBackup() {
    const isScheduleRun = process.env.IS_SCHEDULE_RUN === 'true';
    console.log(`Starting backup process (Scheduled: ${isScheduleRun})...`);

    try {
        const { data: settings, error: settingsError } = await supabase
            .from('report_settings')
            .select('*')
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (settingsError) {
            console.error('Error fetching report settings:', settingsError);
            throw settingsError;
        }

        if (!settings) {
            console.log('No report settings found in database. Exiting.');
            return;
        }

        console.log('Report settings found:', {
            id: settings.id,
            is_enabled: settings.is_enabled,
            frequency: settings.frequency,
            last_sent_at: settings.last_sent_at,
            recipient_count: settings.emails?.length || 0
        });

        // 1. Check if we should proceed
        if (isScheduleRun) {
            if (!settings.is_enabled) {
                console.log('Backup is disabled. Skipping scheduled run.');
                return;
            }

            const cairo = getCairoDate();
            console.log('Current Cairo Time:', cairo);

            // [CRITICAL] Frequency Parsing Logic
            // Format: "Daily", "Weekly-DayIndex" (e.g., "Weekly-3" for Wednesday),
            // "Weekly" (legacy, defaults to Monday), "Monthly", "Yearly"
            let shouldRun = false;
            const frequency = settings.frequency || 'Weekly';

            // Day name mapping for validation
            const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

            if (frequency === 'Daily') {
                // Run every day
                shouldRun = true;
                console.log('Daily schedule: Running backup.');
            } else if (frequency.startsWith('Weekly-')) {
                // Extract day index: "Weekly-3" => 3 (Wednesday)
                const parts = frequency.split('-');
                const selectedDayIndex = parseInt(parts[1]);

                // Validation: Check if day index is valid (0-6)
                if (isNaN(selectedDayIndex) || selectedDayIndex < 0 || selectedDayIndex > 6) {
                    console.error(`Invalid Weekly format: ${frequency}. Expected "Weekly-0" to "Weekly-6". Skipping.`);
                    return;
                }

                const selectedDayName = dayNames[selectedDayIndex];
                shouldRun = cairo.weekday === selectedDayName;
                console.log(`Weekly schedule: Selected ${selectedDayName} (index ${selectedDayIndex}), Today is ${cairo.weekday}. Run: ${shouldRun}`);
            } else if (frequency === 'Weekly') {
                // Legacy format: Default to Monday for backward compatibility
                shouldRun = cairo.weekday === 'Monday';
                console.log(`Weekly schedule (legacy): Defaulting to Monday. Today is ${cairo.weekday}. Run: ${shouldRun}`);
            } else if (frequency === 'Monthly') {
                // Run only on the 1st of the month
                shouldRun = cairo.day === 1;
                console.log(`Monthly schedule: Run on 1st. Today is ${cairo.day}. Run: ${shouldRun}`);
            } else if (frequency === 'Yearly') {
                // Run only on January 1st
                shouldRun = cairo.day === 1 && cairo.month === 1;
                console.log(`Yearly schedule: Run on Jan 1st. Today is ${cairo.month}/${cairo.day}. Run: ${shouldRun}`);
            } else {
                console.error(`Unknown frequency format: ${frequency}. Skipping.`);
                return;
            }

            if (!shouldRun) {
                console.log(`Frequency is ${frequency}, but conditions not met. Skipping.`);
                return;
            }
        }

        const recipients = settings?.emails || [];
        if (recipients.length === 0) {
            console.log('Recipients list is empty in settings. Exiting.');
            return;
        }

        // 2. Fetch All Orders
        console.log('Fetching orders from database...');
        const { data: rawOrders, error: ordersError } = await supabase
            .from('orders')
            .select(`
                id,
                stage,
                order_number,
                customer_name,
                customer_email,
                customer_phone,
                vin,
                company,
                status,
                metadata,
                created_at,
                updated_at,
                order_reminders (*)
            `)
            .order('created_at', { ascending: false });

        if (ordersError) {
            console.error('Error fetching orders:', ordersError);
            throw ordersError;
        }

        if (!rawOrders || rawOrders.length === 0) {
            console.log('No orders found in database to backup.');
            return;
        }

        // 3. Map and Generate CSV
        console.log(`Processing ${rawOrders.length} orders...`);

        const stageMap = {
            orders: "Orders",
            main: "Main Sheet",
            booking: "Booking",
            call: "Call List",
            archive: "Archive",
        };

        const mappedData = [];

        for (const row of rawOrders) {
            // 1. Find the primary reminder (latest uncompleted or just latest)
            let reminderDate = "";
            let reminderTime = "";
            let reminderSubject = "";
            let reminderStatus = "None";

            if (row.order_reminders && Array.isArray(row.order_reminders) && row.order_reminders.length > 0) {
                // Prioritize uncompleted reminders
                const active = row.order_reminders.find(r => !r.is_completed);
                const primary = active || row.order_reminders[0]; // Fallback to first if all completed

                if (primary && primary.remind_at) {
                    const d = new Date(primary.remind_at);
                    reminderDate = d.toISOString().split('T')[0];
                    reminderTime = d.toTimeString().slice(0, 5);
                    reminderSubject = primary.title || "";
                    reminderStatus = primary.is_completed ? "Completed" : "Pending";
                }
            }

            // 2. Extract metadata and parts
            const meta = row.metadata || {};
            const parts = (meta.parts && Array.isArray(meta.parts) && meta.parts.length > 0)
                ? meta.parts
                : [{ partNumber: meta.partNumber || "", description: meta.description || "" }];

            // 3. Generate One Row Per Part
            for (const part of parts) {
                mappedData.push({
                    // Order Identity
                    id: row.id || "",
                    source: stageMap[row.stage] || row.stage || "Unknown",
                    trackingId: row.order_number || "",
                    vin: row.vin || "",
                    status: row.status || "",

                    // Customer Info
                    customerName: row.customer_name || "",
                    customerEmail: row.customer_email || "",
                    customerPhone: row.customer_phone || "",
                    company: row.company || "",

                    // Part Specific (The core focus of this report)
                    partNumber: part.partNumber || "",
                    partDescription: part.description || "",
                    partStatus: meta.partStatus || "", // Part status usually applies to the whole order in this schema

                    // Vehicle & Logistics
                    model: meta.model || "",
                    cntrRdg: meta.cntrRdg || 0,
                    rDate: meta.rDate || "",
                    requester: meta.requester || "",
                    acceptedBy: meta.acceptedBy || "",
                    sabNumber: meta.sabNumber || "",
                    repairSystem: meta.repairSystem || "",

                    // Warranty
                    startWarranty: meta.startWarranty || "",
                    endWarranty: meta.endWarranty || "",
                    remainTime: meta.remainTime || "",

                    // Workflow / Booking
                    bookingDate: meta.bookingDate || "",
                    bookingStatus: meta.bookingStatus || "",

                    // Notes (Separate Columns)
                    noteContent: meta.noteContent || "",
                    actionNote: meta.actionNote || "",
                    bookingNote: meta.bookingNote || "",

                    // Reminders (Dedicated Columns)
                    reminderDate,
                    reminderTime,
                    reminderSubject,
                    reminderStatus,

                    // Archive info
                    archiveReason: meta.archiveReason || "",
                    archivedAt: meta.archivedAt || "",

                    // System Timestamps
                    createdAt: row.created_at || "",
                    updatedAt: row.updated_at || "",
                });
            }
        }

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

        // 4. Send Email via SMTP
        const dateStr = new Date().toISOString().split('T')[0];
        console.log(`Attempting to send email via SMTP to: ${recipients.join(', ')}`);

        const transporter = nodemailer.createTransport({
            host: SMTP_HOST,
            port: SMTP_PORT,
            secure: SMTP_PORT === 465, // true for 465, false for other ports
            auth: {
                user: SMTP_USER,
                pass: SMTP_PASS,
            },
        });

        const mailOptions = {
            from: `"Renault System" <${SMTP_USER}>`,
            to: recipients.join(', '),
            subject: `[Backup] Renault System - ${dateStr}`,
            html: `
          <h1>Automatic Backup Report</h1>
          <p>This is an automated backup of your Renault System data.</p>
          <p><strong>Date (Cairo):</strong> ${new Date().toLocaleString('en-US', { timeZone: 'Africa/Cairo' })}</p>
          <p><strong>Total Orders:</strong> ${mappedData.length}</p>
          <p><strong>Frequency:</strong> ${isScheduleRun ? settings.frequency : 'Manual Trigger'}</p>
          <p>Please find the attached CSV file with all system information including notes and reminders.</p>
        `,
            attachments: [
                {
                    filename: `backup_${dateStr}.csv`,
                    content: csvContent, // nodemailer handles string content directly
                },
            ],
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);

        // 5. Update last_sent_at
        console.log('Updating last_sent_at in database...');
        const { error: updateError } = await supabase
            .from('report_settings')
            .update({ last_sent_at: new Date().toISOString() })
            .eq('id', settings.id);

        if (updateError) {
            console.error('Error updating last_sent_at:', updateError);
        } else {
            console.log('Database updated with last_sent_at.');
        }

    } catch (error) {
        console.error('CRITICAL: Backup process failed:');
        console.error(error);
        process.exit(1);
    }
}

function generateCSV(data, headers) {
    if (data.length === 0) return '';
    const columnHeaders = headers || Object.keys(data[0]);
    const rows = [columnHeaders.join(',')];

    for (const item of data) {
        const values = columnHeaders.map(header => {
            const val = item[header];
            if (val === null || val === undefined) return '';
            const stringVal = typeof val === 'object' ? JSON.stringify(val) : String(val);
            if (stringVal.includes(',') || stringVal.includes('"') || stringVal.includes('\n')) {
                return `"${stringVal.replace(/"/g, '""')}"`;
            }
            return stringVal;
        });
        rows.push(values.join(','));
    }

    return '\uFEFF' + rows.join('\n');
}

runBackup();
