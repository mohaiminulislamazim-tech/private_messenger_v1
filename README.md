# Pulse — Real-time Chat Application

A production-quality, real-time messaging product built for the Senior
Frontend Engineer take-home assignment: direct chats, group conversations,
live delivery over WebSocket, intelligent auto-scroll, and a creative landing
page — all in a responsive, accessible interface.

| Route | Description |
|---|---|
| `/` | Creative landing page with an animated live product preview |
| `/login` | Phone-number sign-in (auto-registers new users) |
| `/chat` | The chat application (list + conversations + groups) |

---

## Features

**Authentication**
- One-step login/registration by phone number + name (per the API design)
- Session persistence across reloads (validated against `GET /auth/me`)
- Loading, validation, and API error states

**Conversations**
- Search users by **name** (server-side) and by **phone number** (client-side
  workaround — see [API Issues](#api-issues--observations))
- Start/open direct conversations (idempotent on the API level)
- Group creation with multi-select member picker and group naming
- Group management UI: rename, promote admins, remove members, leave group
  (admin actions gated client-side to admins)
- Unread badges per conversation, live reordering by latest activity

**Chat experience**
- Full message history with cursor pagination ("load earlier messages" on
  scroll-to-top, reading position preserved)
- Sender/receiver bubbles differentiated by color **and** alignment/shape
  (not color alone), sender names in groups, avatar initials
- Time grouping: day separators (Today / Yesterday / date), clustered
  messages within a 3-minute window, timestamps on every bubble
- Optimistic sending with *Sending…* → *Sent* states and tap-to-retry on
  failure; empty messages blocked; Enter sends, Shift+Enter adds a newline
- Auto-growing composer, long-message wrapping without layout breakage

**Real-time**
- Single shared Socket.io connection with JWT handshake auth
- Incoming messages appear instantly — no refresh, no polling
- Live group updates (`conversation:updated`) keep names/members in sync
- Connection state indicator (Online / Connecting / Reconnecting) with
  automatic reconnection and conversation refresh after reconnect

**Bonus feature — "New messages" intelligent indicator**
- If you've scrolled up to read history, incoming messages never yank you
  back down. A subtle pill ("3 new messages ↓") appears; clicking it glides
  to the latest message. A floating jump-to-latest button appears when simply
  browsing history. Near the bottom, new messages auto-scroll smoothly.

**Landing page**
- Original visual direction (no SaaS template): gradient hero, floating
  device mockup with a self-playing animated conversation, feature grid,
  product story section, CTA — fully responsive with purposeful animation.

---

## Tech Stack

- **React 18** + **TypeScript** (strict)
- **Vite 6** — dev server & production builds
- **Tailwind CSS v4** — design system (spacing, radii, typography, animations)
- **Zustand** — auth + chat state (with `persist` middleware for sessions)
- **Socket.io Client** — real-time transport
- **React Router 6** — routing
- **lucide-react** — icon set
- **ESLint 9** (typescript-eslint, react-hooks)

---

## Architecture

```
src/
├── main.tsx / App.tsx        # entry + routes (/ , /login, /chat)
├── index.css                 # Tailwind theme tokens + keyframes
├── types/                    # shared domain types (User, Conversation, Message)
├── lib/
│   ├── config.ts             # env-configured API base URL
│   ├── api.ts                # fetch wrapper → normalized ApiError
│   ├── socket.ts             # Socket.io singleton manager
│   └── utils.ts              # cn(), date formatting, avatar helpers
├── services/                 # API layer, one module per resource
│   ├── auth.ts  users.ts  conversations.ts  messages.ts
├── stores/
│   ├── authStore.ts          # token/user, login, session restore, logout
│   └── chatStore.ts          # conversations, messages, unread, realtime handlers
├── hooks/
│   ├── useMessageScroll.ts   # intelligent auto-scroll engine
│   └── useDebouncedValue.ts
├── components/ui/            # Button, Input, Modal, Avatar, Spinner, EmptyState…
└── features/
    ├── auth/LoginPage.tsx
    ├── chat/                 # ChatPage, ConversationList, ChatPanel,
    │                         # MessageList, MessageBubble, Composer,
    │                         # NewChatModal, GroupInfoModal
    └── landing/              # LandingPage, ChatPreview (animated mockup)
```

Key decisions:

- **Normalization at the boundary.** REST returns `_id` + ISO dates while the
  socket returns `id` + epoch millis; both are converted into one internal
  `Message` type so the UI never sees two shapes.
- **One socket, store-driven.** A single Socket.io connection lives in a
  module-level manager; React attaches named handlers once and removes them on
  cleanup. All socket payloads flow through the Zustand store, so components
  stay declarative and there is exactly one subscription per event.
- **Optimistic sending with reconciliation.** Sent messages get temp ids and
  a `sending` status, then swap to the server copy; failures become retryable.
  Incoming messages deduplicate by id (and replace matching optimistic
  entries as a race-condition safety net).
- **Scroll logic isolated in `useMessageScroll`.** It owns near-bottom
  tracking, initial jump, smooth follow, prepend position restoration, and
  unseen counts — the component just renders the pill.

---

## Getting Started

```bash
npm install
cp .env.example .env      # adjust the API URL if needed
npm run dev               # http://localhost:5173
```

Other scripts:

```bash
npm run build       # type-check + production build
npm run preview     # serve the production build locally
npm run lint        # eslint
npm run typecheck   # tsc -b --noEmit
```

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_API_BASE_URL` | no | REST base + socket origin. Defaults to `https://frontend-task-chatapp.onrender.com` |

No secrets are required — the API uses JWTs issued at login time only.

---

## API Documentation

Full reverse-engineered endpoint reference (request/response shapes, error
codes, quirks): **[docs/API.md](docs/API.md)**

---

## Real-time Implementation

The API ships a **Socket.io WebSocket gateway** at the server root origin —
this is used, not a polling fallback.

1. After login, `socketManager.connect(token)` opens one connection with the
   JWT in the handshake (`auth.token`). Invalid tokens are rejected by the
   server at connect time.
2. `message:new` delivers incoming messages for all your conversations. The
   handler normalizes the payload (`id`, epoch-ms timestamp), appends it to
   the right conversation with id-based deduplication, bumps unread badges
   for non-active chats, and reorders the conversation list.
3. `conversation:updated` keeps group metadata (name, members, admins)
   current for everyone in the group.
4. Sending happens over REST (`POST /messages`) with optimistic UI; the
   server does not echo the sender's own messages, and any duplicate socket
   delivery would be absorbed by dedup anyway.
5. Connect/disconnect/reconnect events drive the connection indicator;
   after a reconnect the conversation list is refreshed to catch anything
   missed while offline. Handlers are removed on unmount/logout — no stale
   listeners or duplicate subscriptions (verified under React StrictMode).

---

## Design Decisions

- **Vite + React over Next.js**: this is a pure client-side SPA talking to an
  existing API; there is no SSR/sever need, so Vite gives the fastest DX and
  simplest deployment story.
- **Tailwind v4 with a themed token layer**: consistent spacing/radius/type
  scale plus custom keyframes, keeping styling cohesive without runtime CSS.
- **Zustand over Redux/context**: minimal boilerplate for two well-scoped
  stores, with built-in `persist` for sessions.
- **Client-side phone search**: forced by API limitations (see below) — the
  trade-off and its cap are documented rather than hidden.
- **Accessibility**: semantic landmarks, labelled inputs/buttons, `role="log"`
  + `aria-live` message region, keyboard-operable dialogs (Esc), visible
  focus rings, and sender/receiver distinction that doesn't rely on color
  alone (alignment + shape + labels).

---

## AI Usage

AI tools were used as a productivity aid, under explicit human direction and
review:

- **Used for**: scaffolding boilerplate (Vite/TS/ESLint configs), generating
  first drafts of routine UI components (buttons, modals, form layouts),
  drafting the scroll-position-preservation math, and accelerating this
  documentation.
- **Human verification**: every AI-generated piece was reviewed, corrected,
  and validated against the **live API** — e.g., the AI initially assumed
  standard `401` semantics and working phone search; probing revealed both
  assumptions were wrong and the code was rewritten accordingly. The
  realtime payload-shape mismatch (`id` vs `_id`) was discovered by testing,
  not assumed.
- **Rejected/discarded**: an AI-suggested full-page-reload after leaving a
  group (replaced with proper store updates), a broken "jump to latest"
  implementation stub, and generic template-style landing page copy.
- **Manually implemented**: the entire API probing process, error-format
  normalization, dedup strategy, unread-badge logic, and all end-to-end
  browser tests that verify the final behavior.

---

## API Issues / Observations

Discovered by actively probing the live API (full details in
[docs/API.md](docs/API.md)); each has a deliberate workaround:

1. **Search crashes on `+`** — `GET /users/search?q=+1555…` returns HTTP 500
   with a raw MongoDB regex error because the server interpolates `q` into a
   `RegExp`. *Handled by escaping regex metacharacters client-side.*
2. **Phone search doesn't exist server-side** — matching is name-prefix only;
   even exact existing phone numbers return `[]`. *Workaround: digit-bearing
   queries fetch the user list once and filter by phone/name substring
   client-side. Limitation: covers the most recent ~50 users (next issue).*
3. **Search results hard-capped at 50**, no pagination parameter. *Documented;
   name-prefix search still finds anyone whose name starts with the query.*
4. **Empty messages accepted** — `POST /messages` happily stores `"text": ""`.
   *The client blocks empty/whitespace sends before hitting the API.*
5. **Socket vs REST payload mismatch** — socket messages use `id` +
   epoch-millis `createdAt`; REST uses `_id` + ISO strings. *Normalized into
   one internal type at the boundary.*
6. **No self-echo on sent messages** — the server doesn't deliver your own
   message back via `message:new`. *UI applies its own messages from the REST
   response optimistically; dedup guards against races.*
7. **Missing token returns HTTP 400 (`NO_TOKEN`)** instead of 401. *Error
   handling keys off the error `code`, not the status code alone.*
8. **`lastMessage` is `{}`** (empty object) for conversations with no
   messages instead of `null`. *Treated as "no messages" in the UI.*
9. **Login overwrites the display name** — signing in with an existing phone
   replaces the stored name with the request body's name. *The client always
   sends the user's intended current name.*
10. **`before` cursor must be an ObjectId** — non-ids cause HTTP 500 cast
    errors. *Only real message ids are ever sent as cursors.*
11. **Anyone can log in as anyone** (no password verification). This is an
    inherent API design property; nothing client-side can fix it, but it's
    worth flagging for reviewers.
12. **Intermittently slow mutations** — member removal / leave-group DELETEs
    occasionally take several seconds on the free-tier deployment. The UI
    keeps buttons in a loading state until the server responds rather than
    guessing the outcome.

---

## Improvements With More Time

- Virtualized message list (e.g. `react-virtuoso`) for conversations with
  tens of thousands of messages
- Read receipts / typing indicators if the API grows support for them
- Media attachments, emoji picker, markdown rendering
- PWA offline shell + background push notifications
- E2E test suite in CI (Playwright) covering the flows verified manually here
- Storybook for the UI primitives
- i18n and dark mode (design tokens already centralized)

---

## Live Demo

> _Placeholders — deploy via Vercel/Netlify and paste the URLs._

- **Landing page:** `https://<your-app>.vercel.app/`
- **Chat application:** `https://<your-app>.vercel.app/login`
  (deploy steps: `npm run build` → serve `dist/`; set `VITE_API_BASE_URL`)

## GitHub Repository

> _Add your repository URL here after pushing._
