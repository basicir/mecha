# Mecha Oldal - Statika Kalkulátor

A calculator web application for statics problems, built for engineering students. Users with approved customer IDs can input variables and calculate results based on pre-configured exam templates.

## Features

- 🔐 **UUID-based Authentication**: Each customer gets a unique ID for access
- 🧮 **One-Time Calculation**: Users can calculate only once per customer ID
- 💾 **Auto-save**: Input values are saved every 2 seconds
- 📱 **Mobile-Friendly**: Responsive design for all devices
- 🇭🇺 **Hungarian UI**: Full Hungarian language interface

## Tech Stack

- **Frontend**: Next.js 15 with React
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel
- **Math Engine**: mathjs

## Setup

### 1. Clone and Install

```bash
git clone <repo-url>
cd mecha
npm install
```

### 2. Configure Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run the SQL schema in Supabase SQL Editor:
   ```
   supabase-schema.sql
   ```
3. Create `.env.local` from example:
   ```bash
   cp .env.local.example .env.local
   ```
4. Add your Supabase credentials to `.env.local`

### 3. Run Development Server

```bash
npm run dev
```

### 4. Deploy to Vercel

Connect your GitHub repo to Vercel and add environment variables.

## Project Structure

```
src/
├── app/
│   ├── page.js           # Sign-in page
│   ├── calculator/       # Calculator interface
│   └── results/          # Results display
├── lib/
│   ├── supabase.js       # Database client
│   ├── calculator.js     # Math engine
│   └── config/
│       └── tasks.json    # Problem configurations
```

## Creating Customer IDs

Use the Supabase SQL Editor:

```sql
SELECT generate_customer_id('Customer Name');
```

This returns a UUID that the customer can use to sign in.

## License

Private project.
