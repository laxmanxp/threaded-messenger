# Threadly

WhatsApp-style messaging with **multilevel nested threads** (Reddit/Slack-style replies under any message), attachments, and a mobile-friendly PWA.

Two modes:

1. **Local demo** (default) — seed users, conversations, and `localStorage`. No backend required.
2. **Organization cloud** — Supabase Auth + Postgres + Realtime + Storage. Admins create an org, manage members (name, designation, department), share invite links; members join via `/join/:token`, see the org directory, and sync group chats with history.

## Run locally

```bash
npm install
cp .env.example .env   # optional until you enable org mode
npm run dev
```

Open the URL Vite prints (default [http://localhost:5173](http://localhost:5173)).

Production build:

```bash
npm run build
npm run preview
```

If Supabase env vars are missing, the app stays on the local demo (or shows a clear setup screen when you open org mode). It does not crash.

## Supabase setup (org mode)

1. Create a free project at [supabase.com](https://supabase.com).
2. In **Project Settings → API**, copy the Project URL and `anon` `public` key.
3. Copy `.env.example` → `.env` and set:

   ```bash
   VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
   ```

4. In the Supabase **SQL Editor**, run the migration file:

   [`supabase/migrations/001_org_cloud.sql`](supabase/migrations/001_org_cloud.sql)

   This creates `organizations`, `profiles`, `org_members`, `invites`, `conversations`, `conversation_members`, `messages`, `attachments`, RLS policies, Storage bucket `attachments`, and `accept_invite()`.

5. Restart `npm run dev`. Use **Org mode** in the header (or open `/join/<token>`).

Never commit `.env` or real keys. Only `.env.example` is in git.

### Org roles

| Role | Capabilities |
|------|----------------|
| **Admin** | Create organization; edit members (name, designation, department, role); generate invite links; create group conversations. |
| **Member** | Open invite link, join org, view directory (name, designation, department, contact), use synced group chats with thread/attachment UX. |

`organizations.plan` / `is_paid` are stubs for future billing (default `free` / `false`).

## What you can do (local demo)

- Browse the chat list (avatar, preview, time, unread badge).
- Send top-level messages with **Enter** (Shift+Enter for a newline).
- Click **Reply** or a reply count to open the **thread panel**.
- Nest replies as deep as you like. Indent + left rail show hierarchy; **Collapse** hides a subtree.
- **Attachments:** paperclip in composers (up to 6 files, 3 MB each).
- **Switch user**, **Light / Dark**, **Reset** demo data.

## Install as an app (PWA)

```bash
npm run build
npm run preview
```

Install from the browser on localhost/HTTPS (Chrome install icon, or iOS **Share → Add to Home Screen**).

## Stack

Vite + React + TypeScript + Tailwind CSS v4. Local state: `src/store/messengerStore.tsx`. Org cloud: `src/org/*` + Supabase.

## Data model (local)

`Message`: `id`, `conversationId`, `authorId`, `parentId` (`null` for chat-level), `body`, `createdAt`, `attachments`.

## Schema (cloud)

See `supabase/migrations/001_org_cloud.sql`. RLS limits members to their org directory and conversations they belong to.
