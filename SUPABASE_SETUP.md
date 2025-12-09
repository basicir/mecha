# Supabase Setup Guide for Task Manager

## Overview

This application now stores task configurations in Supabase, ensuring they're synced during build time.

## Setup Steps

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note your project URL and keys

### 2. Set Environment Variables

Create a `.env.local` file in the project root:

```bash
cp .env.example .env.local
```

Fill in your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**Important for Vercel deployment:**
Add these same environment variables to your Vercel project settings.

### 3. Run Database Migration

Run the migration to create the `tasks_config` table:

```bash
# If using Supabase CLI
supabase migration up

# Or manually run the SQL in supabase/migrations/20250101000000_create_tasks_config.sql
# in the Supabase SQL Editor
```

### 4. Initial Data Upload

Parse your HTML file and upload to both local and Supabase:

```bash
# 1. Parse HTML and create tasks.json
npm run parse-html

# 2. The admin page will automatically upload to Supabase when you click Save
```

## Workflow

### Updating Tasks

1. Edit the `Create Next App.html` file with your task data
2. Run `npm run parse-html` to update `tasks.json`
3. Go to `/admin` page and click **💾 Save**
4. This saves to both local file AND Supabase

### Build Process

When you run `npm run build`:

1. **Pre-build step** runs automatically (`scripts/syncFromSupabase.ts`)
2. Fetches latest config from Supabase
3. Updates local `config/tasks.json`
4. Continues with normal build

This ensures production always has the latest tasks from Supabase.

## Database Schema

```sql
tasks_config
- id: UUID (primary key)
- config_data: JSONB (stores the entire configuration)
- version: INTEGER (increments on each save)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP (auto-updated via trigger)
```

## Scripts

- `npm run parse-html` - Parse Create Next App.html to tasks.json
- `npm run build` - Build (automatically syncs from Supabase first)
- `npx tsx scripts/syncFromSupabase.ts` - Manually sync from Supabase

## Troubleshooting

### Build fails to fetch from Supabase

The build will continue with existing `tasks.json` if Supabase fetch fails. Check:
- Environment variables are set in Vercel
- Supabase service is accessible
- Migration has been run

### Admin save fails

Check:
- `SUPABASE_SERVICE_ROLE_KEY` is set
- Database migration has been run
- Table `tasks_config` exists

### Local vs Supabase mismatch

Always use admin page Save button to ensure both are in sync. Supabase is the source of truth during builds.
