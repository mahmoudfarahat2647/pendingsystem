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
