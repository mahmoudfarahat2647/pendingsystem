# Database Schema (Supabase)

The pendingsystem uses Supabase (PostgreSQL) for persistence. Below is the structure of the primary tables and their relationships.

## Table: `orders`

The central table for all logistics data.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` | Primary Key (Auto-generated) |
| `order_number` | `text` | The tracking or reference number (maps to `trackingId`) |
| `customer_name` | `text` | Name of the customer |
| `customer_phone` | `text` | Contact number (maps to `mobile`) |
| `vin` | `text` | Vehicle Identification Number |
| `company` | `text` | Vehicle brand/company (e.g., Renault, Zeekr) |
| `stage` | `text` | Current workflow stage (`orders`, `main`, etc.) |
| `metadata` | `jsonb` | Flexible storage for additional fields (parts, warranty, etc.) |
| `created_at` | `timestamp` | Record creation time |
| `updated_at` | `timestamp` | Last update time |

## Table: `order_reminders`

Stores scheduled reminders associated with orders.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` | Primary Key |
| `order_id` | `uuid` | Foreign Key to `orders.id` |
| `title` | `text` | Reminder subject/content |
| `remind_at` | `timestamp` | Scheduled UTC time for the reminder |
| `is_completed` | `boolean` | Completion status |

