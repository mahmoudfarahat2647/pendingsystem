/**
 * Database row types matching Supabase schema
 * These types ensure type-safety when mapping Supabase responses
 */

export interface SupabaseOrderRow {
	id: string;
	stage: "orders" | "main" | "call" | "booking" | "archive";
	order_number: string | null;
	customer_name: string;
	customer_email: string | null;
	customer_phone: string | null;
	vin: string;
	company: string | null;
	status: string | null;
	metadata: Record<string, unknown>;
	created_at: string;
	updated_at: string;
	order_reminders?: SupabaseReminderRow[];
}

export interface SupabaseReminderRow {
	id: string;
	order_id: string;
	title: string;
	remind_at: string;
	is_completed: boolean;
	created_at: string;
}

export interface SupabaseDashboardStats {
	pending_count: number;
	orders_count: number;
	call_count: number;
	booking_count: number;
	archive_count: number;
}
