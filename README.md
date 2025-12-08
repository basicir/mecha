# Mecha Oldal

A one-time calculator application for statics problems.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a Supabase project and run the SQL schema in `supabase/schema.sql`

3. Copy `.env.example` to `.env.local` and add your Supabase credentials:
```bash
cp .env.example .env.local
```

4. Run the development server:
```bash
npm run dev
```

## Environment Variables

Required for Vercel deployment:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
