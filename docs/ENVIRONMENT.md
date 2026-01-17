# Environment Configuration

This document lists the environment variables required to run the Renault System in development and production.

## Required Variables

These variables are foundational and must be defined in your `.env.local` file.

| Variable | Description | Source |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | The API URL for your Supabase project. | Supabase Dashboard > Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | The anonymous public key for Supabase client initialization. | Supabase Dashboard > Settings > API |

## Optional Variables

| Variable | Description |
| :--- | :--- |
| `NEXT_PUBLIC_APP_NAME` | The display name for the application (defaults to "Renault System"). |
| `NEXT_PUBLIC_SENTRY_DSN` | (Future) Data Source Name for Sentry error tracking. |

## Backup & SMTP Configuration (GitHub Secrets)

These variables are required for the automated backup feature and must be set in **GitHub Repository Secrets**.

| Variable | Description |
| :--- | :--- |
| `SUPABASE_URL` | The HTTPS URL of your Supabase project (Required for scripts). |
| `SUPABASE_SERVICE_ROLE_KEY` | The Service Role Key (bypasses RLS) for fetching full database. |
| `SMTP_HOST` | SMTP Server (e.g., `smtp.gmail.com`). |
| `SMTP_PORT` | SMTP Port (e.g., `587`). |
| `SMTP_USER` | Email address for sending reports. |
| `SMTP_PASS` | App Password for the email account. |
| `GITHUB_PAT` | Personal Access Token for triggering workflows via API. |

## Local Setup

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Populate the required Supabase variables.
3. Restart the development server:
   ```bash
   npm run dev
   ```
