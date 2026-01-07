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

        const recipients = settings?.emails || [];
        if (recipients.length === 0) {
            console.log('Recipients list is empty in settings. Exiting.');
            return;
        }

        if (!settings.is_enabled) {
            console.log('Backup is currently disabled in settings. skipping.');
            // We proceed if triggered manually, but good to log
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
        const base64Csv = Buffer.from(csvContent).toString('base64');

        // 4. Send Email via Resend
        const date = new Date().toISOString().split('T')[0];
        console.log(`Attempting to send email via Resend to: ${recipients.join(', ')}`);

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
            const errorText = await resendRes.text();
            console.error('Resend API call failed:');
            console.error('Status:', resendRes.status);
            console.error('Response:', errorText);
            throw new Error(`Resend API error (${resendRes.status}): ${errorText}`);
        }

        const resendData = await resendRes.json();
        console.log('Resend API response:', resendData);
        console.log('Backup email sent successfully!');

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
