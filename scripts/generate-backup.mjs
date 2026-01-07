import { createClient } from '@supabase/supabase-js';

// Configuration from environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !RESEND_API_KEY) {
    console.error('Missing required environment variables');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function runBackup() {
    console.log('Starting backup process...');

    try {
        const { data: settings, error: settingsError } = await supabase
            .from('report_settings')
            .select('*')
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (settingsError) throw settingsError;

        const recipients = settings?.emails || [];
        if (recipients.length === 0) {
            console.log('No recipients configured. Exiting.');
            return;
        }

        // 2. Fetch All Orders
        console.log('Fetching orders...');
        const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });

        if (ordersError) throw ordersError;
        if (!orders || orders.length === 0) {
            console.log('No orders to backup.');
            return;
        }

        // 3. Generate CSV
        console.log(`Generating CSV for ${orders.length} orders...`);
        const csvContent = generateCSV(orders);
        const base64Csv = Buffer.from(csvContent).toString('base64');

        // 4. Send Email via Resend
        const date = new Date().toISOString().split('T')[0];
        console.log(`Sending email to: ${recipients.join(', ')}`);

        const resendRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: 'onboarding@resend.dev',
                to: recipients,
                subject: `[Backup] Renault System - ${date}`,
                html: `
          <h1>Automatic Backup Report</h1>
          <p>This is an automated backup of your Renault System data.</p>
          <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>Total Orders:</strong> ${orders.length}</p>
          <p>Please find the attached CSV file.</p>
        `,
                attachments: [
                    {
                        filename: `backup_${date}.csv`,
                        content: base64Csv,
                    },
                ],
            }),
        });

        if (!resendRes.ok) {
            const error = await resendRes.text();
            throw new Error(`Resend API error: ${error}`);
        }

        console.log('Backup email sent successfully!');

        // 5. Update last_sent_at
        await supabase
            .from('report_settings')
            .update({ last_sent_at: new Date().toISOString() })
            .eq('id', settings.id);

        console.log('Database updated with last_sent_at.');

    } catch (error) {
        console.error('Backup failed:', error);
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
