export const ORDERS_SELECT_BASE = `
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
`;

export const ORDERS_SELECT_WITH_ATTACHMENTS = `
	id,
	stage,
	order_number,
	customer_name,
	customer_email,
	customer_phone,
	vin,
	company,
	attachment_link,
	attachment_file_path,
	attachment_file_paths,
	status,
	metadata,
	created_at,
	updated_at,
	order_reminders (*)
`;
