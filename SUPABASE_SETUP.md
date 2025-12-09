# Supabase Setup Guide - Task Configuration Manager

## Overview

Task configurations are managed through the `/admin` page and stored in Supabase. During build, the latest config is fetched from Supabase and used to generate `tasks.json` on the server.

## Correct Workflow

```
┌─────────────┐
│ Admin Page  │  Configure tasks via UI
│  /admin     │
└──────┬──────┘
       │ Click 💾 Save
       ▼
┌─────────────┐
│  Supabase   │  Single source of truth
│ tasks_config│
└──────┬──────┘
       │
       │ During build (npm run build)
       ▼
┌─────────────┐
│ tasks.json  │  Generated on server
│  (server)   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│Calculator & │  Read from tasks.json
│Results Pages│
└─────────────┘
```

## Setup Steps

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note your **Project URL** and **API Keys**

### 2. Set Environment Variables

**Local Development** - Create `.env.local`:

```bash
cp .env.example .env.local
```

Fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**Vercel/Production** - Add these same variables in Vercel project settings:
- Settings → Environment Variables → Add each variable

### 3. Run Database Migration

Create the `tasks_config` table:

**Option A: Using Supabase SQL Editor**
1. Go to your Supabase project → SQL Editor
2. Copy and paste contents of `supabase/migrations/20250101000000_create_tasks_config.sql`
3. Click "Run"

**Option B: Using Supabase CLI** (if installed)
```bash
supabase migration up
```

### 4. Initial Upload to Supabase

You have to upload your current `tasks.json` to Supabase **once**:

```bash
npx tsx scripts/uploadInitialConfig.ts
```

This script:
- Reads current `config/tasks.json`
- Uploads it to Supabase
- Only needs to run **once**

After this, **always use the `/admin` page** to manage configurations.

## Daily Workflow

### Making Changes to Tasks

1. Open `/admin` page in browser
2. Edit tasks:
   - Add/remove input variables
   - Add/remove equations
   - Edit formulas
   - Update showing text
3. Click **💾 Save** button
4. ✅ Saved to Supabase automatically

### Deploying Changes

1. Push any code changes to GitHub
2. Vercel automatically builds
3. **During build:**
   - `prebuild` script runs (`scripts/syncFromSupabase.ts`)
   - Fetches latest config from Supabase
   - Updates server's `tasks.json`
4. ✅ Production has latest configuration

**No manual steps needed** - just push to GitHub!

## Database Schema

```sql
CREATE TABLE tasks_config (
    id UUID PRIMARY KEY,
    config_data JSONB NOT NULL,      -- Full task configuration
    version INTEGER DEFAULT 1,        -- Auto-increments on save
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()  -- Auto-updated
);
```

The `config_data` JSONB field stores the complete configuration in this format:

```json
{
  "tasks": [...],
  "lastUpdated": "2025-12-09T14:00:00Z"
}
```

## Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `uploadInitialConfig.ts` | **ONE-TIME** - Upload existing tasks.json to Supabase | `npx tsx scripts/uploadInitialConfig.ts` |
| `syncFromSupabase.ts` | Fetch from Supabase → update local tasks.json | Runs automatically during `npm run build` |
| `parseHtmlSimple.ts` | *(Legacy)* Parse HTML snapshot | Not needed in normal workflow |

## Troubleshooting

### "Admin Save Failed"

**Check:**
1. Environment variables are set correctly in `.env.local`
2. `SUPABASE_SERVICE_ROLE_KEY` is present (not just anon key)
3. Database migration has been run
4. Table `tasks_config` exists in Supabase

**How to verify:**
```bash
# Check environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY

# In Supabase: go to Table Editor and look for tasks_config
```

### "Build Failed to Fetch from Supabase"

The build will **continue** with existing `tasks.json` if Supabase fetch fails.

**In Vercel:**
1. Go to Project Settings → Environment Variables
2. Verify all 3 variables are set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Redeploy

### "Config Seems Out of Date"

Supabase is the source of truth. If local and production differ:

1. Make changes on `/admin` page
2. Click **💾 Save** (uploads to Supabase)
3. Redeploy on Vercel (fetches from Supabase)

**Never edit `tasks.json` manually** - always use admin page!

## File Structure

```
mecha/
├── config/
│   └── tasks.json              # Generated from Supabase during build
├── scripts/
│   ├── uploadInitialConfig.ts  # ONE-TIME: Upload to Supabase
│   └── syncFromSupabase.ts     # Runs on every build
├── src/
│   ├── app/
│   │   ├── admin/              # Admin UI for managing tasks
│   │   └── api/
│   │       └── admin/
│   │           └── config/     # API: Save to Supabase
│   └── lib/
│       └── taskParser.ts       # Supabase read/write functions
└── supabase/
    └── migrations/
        └── 20250101000000_create_tasks_config.sql
```

## FAQ

**Q: Where do I add new tasks?**  
A: Use the `/admin` page in your browser. Click "+ Add Task" if you add that feature, or manually add via the admin UI.

**Q: Can I edit tasks.json directly?**  
A: No! Changes to `tasks.json` will be overwritten on next build. Always use `/admin` page.

**Q: What if Supabase is down during build?**  
A: Build continues with existing `tasks.json` file. You'll see a warning in build logs.

**Q: How do I see what's in Supabase?**  
A: Go to Supabase → Table Editor → tasks_config table. You'll see the JSONB data and version numbers.
