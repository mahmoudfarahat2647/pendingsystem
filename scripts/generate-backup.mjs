import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

// Configuration from environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// SMTP Configuration
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.error('Missing required environment variables');
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

            let shouldRun = false;
            if (settings.frequency === 'Weekly') {
                // Run only on Mondays
                shouldRun = cairo.weekday === 'Monday';
            } else if (settings.frequency === 'Monthly') {
                // Run only on the 1st of the month
                shouldRun = cairo.day === 1;
            } else if (settings.frequency === 'Yearly') {
                // Run only on January 1st
                shouldRun = cairo.day === 1 && cairo.month === 1;
            }

            if (!shouldRun) {
                console.log(`Frequency is ${settings.frequency}, but today is ${cairo.weekday}, ${cairo.month}/${cairo.day}. Skipping.`);
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
        const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });

        if (ordersError) {
            console.error('Error fetching orders:', ordersError);
            throw ordersError;
        }

        if (!orders || orders.length === 0) {
            console.log('No orders found in database to backup.');
            return;
        }

        // 3. Generate CSV
        console.log(`Generating CSV for ${orders.length} orders...`);
        const csvContent = generateCSV(orders);

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
          <p><strong>Total Orders:</strong> ${orders.length}</p>
          <p><strong>Frequency:</strong> ${isScheduleRun ? settings.frequency : 'Manual Trigger'}</p>
          <p>Please find the attached CSV file.</p>
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

function generateCSV(data) {
    if (data.length === 0) return '';
    const headers = Object.keys(data[0]);
    const rows = [headers.join(',')];

    for (const item of data) {
        const values = headers.map(header => {
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

    return rows.join('\n');
}

runBackup();
