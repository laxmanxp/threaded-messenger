# Threadly

WhatsApp-style messaging with **multilevel nested threads** (Reddit/Slack-style replies under any message). Local-first: demo users, seed conversations, and persistence in `localStorage`. No backend.

## Run locally

```bash
npm install
npm run dev
```

Open the URL Vite prints (default [http://localhost:5173](http://localhost:5173)).

Production build:

```bash
npm run build
npm run preview
```

## What you can do

- Browse the chat list (avatar, preview, time, unread badge).
- Send top-level messages with **Enter** (Shift+Enter for a newline).
- Click **Reply** or a reply count to open the **thread panel**.
- Nest replies as deep as you like. Indent + left rail show hierarchy; **Collapse** hides a subtree.
- The composer in a thread shows **Replying to …**. Clear it to reply to the thread root.
- **Switch user** (Maya, Jordan, Sam) to simulate a small team. Unread badges follow the active user.
- **Light / Dark** themes. **Reset** restores the original demo data.
- **Attachments:** paperclip in the chat and thread composers. Images show as thumbnails (tap to preview); other files show name + size and download on click. You can attach up to **6 files**, **3 MB each**. Images are resized/compressed to JPEG/PNG before saving.

The Design Squad chat opens with a rich nested thread on first load so the app never feels empty. Seed data includes a screenshot in the main chat and a CSV in the launch thread.

## Stack

Vite + React + TypeScript + Tailwind CSS v4. State lives in `src/store/messengerStore.tsx` and is saved under `threaded-messenger:v1`.

## Data model

`Message` (`src/types.ts`): `id`, `conversationId`, `authorId`, `parentId` (`null` for a chat-level message), `body`, `createdAt`, `attachments` (image or file, stored as data URLs).
