# Threadly

WhatsApp-style messaging with **multilevel nested threads**, attachments, and a mobile-friendly PWA.

Two modes:

1. **Local demo** (default) — seed users, conversations, and `localStorage`. No backend required.
2. **Organization cloud** — Supabase Auth + Postgres + Realtime + Storage. Admins create an org, manage members (name, designation, department), share invite links; members join via `/join/:token`, see the org directory, and sync group chats with history.

## Run locally

```bash
npm install
cp .env.example .env   # optional until you enable org mode
npm run dev
```

## Supabase setup (org mode)

1. Create a free project at https://supabase.com
2. Project Settings → API: copy URL and anon key into `.env`:

```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

3. In Supabase SQL Editor, run these migrations **in order**:
   - `supabase/migrations/001_schema_tables.sql`
   - `supabase/migrations/002_rls_and_functions.sql`
   - `supabase/migrations/003_storage_and_rpcs.sql`

4. Restart `npm run dev`. Use **Org mode** in the header (or open `/join/<token>`).

Never commit `.env`. Only `.env.example` is in git.

If env is missing, the app stays on local demo / shows a setup screen — it does not crash.

`organizations.plan` / `is_paid` are stubs for future billing.

## Stack

Vite + React + TypeScript + Tailwind CSS v4 + Supabase (`@supabase/supabase-js`).
