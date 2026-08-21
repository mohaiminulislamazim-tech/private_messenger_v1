# Chat API — Client Documentation

Reverse-engineered documentation of the live Chat API at
`https://frontend-task-chatapp.onrender.com`, verified by inspecting actual
request/response behavior (the official Swagger spec intentionally omits
response shapes and status codes).

- **REST base URL:** `https://frontend-task-chatapp.onrender.com/api`
  (configurable via `VITE_API_BASE_URL`)
- **WebSocket (Socket.io):** connects to the **root origin**
  (`https://frontend-task-chatapp.onrender.com`) — *not* the `/api` base.
- **Content type:** JSON everywhere.

---

## Authentication

1. `POST /auth/login` with a phone number and name. There is no separate
   registration — a new phone number is registered automatically; an existing
   one logs in. The response contains a JWT.
2. Send the token on every protected request:
   `Authorization: Bearer <token>`.
3. For Socket.io, pass the same token in the handshake: `io(origin, { auth: { token } })`.

---

## Error format

All REST errors share one shape:

```json
{
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "details": [{ "path": "phone", "message": "phone is required" }]
  }
}
```

`details` is present only for validation errors. Notable quirk: a **missing**
token returns HTTP **400** with code `NO_TOKEN` rather than 401; invalid
tokens return 401/500 depending on the endpoint.

---

## Auth

### `POST /auth/login` — log in or register

| | |
|---|---|
| Auth | none |
| Purpose | One step for login and registration |

**Request body**

```json
{ "phone": "+15551234567", "name": "Ada Lovelace" }
```

**Response `200`**

```json
{
  "token": "<JWT>",
  "user": { "_id": "6a88…", "name": "Ada Lovelace", "phone": "+15551234567", "createdAt": "2026-08-21T10:24:29.021Z" }
}
```

**Errors**

- `400 VALIDATION_ERROR` — missing/empty `phone` or `name`.

**Assumptions / observations**

- Logging in with an existing phone **overwrites the stored name** with the
  name in the request body. The client therefore always sends the user's
  current display name.
- No password exists: possession of a phone number is enough to log in as
  that user. This is an API design property, not something the client can fix.

### `GET /auth/me` — current user

| | |
|---|---|
| Auth | bearer token |
| Purpose | Restore/validate a session |

**Response `200`**: the user object (same shape as above, no wrapper).

**Errors**: invalid/expired token → error response; the client logs out.

---

## Users

### `GET /users/search?q=<term>` — find users

| | |
|---|---|
| Auth | bearer token |
| Purpose | Find other users to chat with |

**Query parameters**

- `q` (string, effectively required) — search term.

**Response `200`**: a **bare array** (no wrapper):

```json
[{ "_id": "6a88…", "name": "Alice Smith", "phone": "+8801700000002" }]
```

Empty result → `[]`. Empty `q` → **all users** (capped at 50).

**Behavior quirks discovered by probing (important):**

1. The server builds a JavaScript `RegExp` from `q`. A leading `+` (as in
   phone numbers) is an invalid quantifier → **HTTP 500** with a raw Mongo
   error (`{"error":{"message":"Regular expression is invalid…","code":51091}}`).
   The client escapes regex metacharacters before sending.
2. Matching is **name-prefix only**: `"Ahasan"` matches but `"hasan"` does
   not; the phone field is never matched — searching an exact existing phone
   number returns `[]`.
3. Results are capped at **50**, with no pagination parameter.

**Client workaround** (implemented in `src/services/users.ts`): queries that
contain digits are treated as phone-style lookups — the client fetches the
full list once and filters by phone/name substring locally. Phone search
therefore covers the most recent ~50 users only.

---

## Conversations

### `GET /conversations` — list my conversations

| | |
|---|---|
| Auth | bearer token |
| Purpose | Sidebar list of direct + group conversations |

**Response `200`** — wrapped in `data`, sorted by recent activity:

```json
{
  "data": [
    {
      "_id": "6a88…",
      "type": "direct",
      "lastMessage": { "text": "Hello", "sender": "6a88…", "createdAt": "2026-08-21T10:25:57.418Z" },
      "updatedAt": "2026-08-21T10:25:57.653Z",
      "participant": { "_id": "6a88…", "name": "Test User 1", "phone": "+15550002221" }
    },
    {
      "_id": "6a89…",
      "type": "group",
      "lastMessage": {},
      "updatedAt": "…",
      "name": "Probe Group",
      "createdBy": "6a88…",
      "admins": ["6a88…"],
      "participants": [{ "_id": "6a88…", "name": "Different Name", "phone": "+15550001111" }]
    }
  ]
}
```

**Quirks**

- Direct conversations expose the other user via the singular `participant`;
  groups carry `name`, `createdBy`, `admins[]`, `participants[]`.
- `lastMessage` is an **empty object `{}`** when no messages exist yet — the
  client must treat it as "no messages".

### `POST /conversations` — start/open a direct conversation

| | |
|---|---|
| Auth | bearer token |
| Purpose | Start (or reopen) a 1-to-1 conversation |

**Request body**: `{ "userId": "6a88…" }`

**Response `200`**:

```json
{ "_id": "6a88…", "participants": ["<me>", "<them>"], "createdAt": "…" }
```

**Observations**

- **Idempotent**: starting a conversation that already exists returns the
  existing conversation (same `_id`).
- The response is sparse — it does not include the other user's profile or
  `type`. The client merges it with any cached conversation entry and
  refreshes the list afterwards.

### `GET /conversations/{id}/messages` — message history

| | |
|---|---|
| Auth | bearer token |
| Purpose | Paginated history for a conversation |

**Query parameters**

- `limit` (int, optional) — page size.
- `before` (ObjectId string, optional) — cursor: pass the `_id` of the oldest
  message of the current page to get the next older page.

**Response `200`** — messages sorted **newest-first**:

```json
{
  "messages": [
    { "_id": "6a88…", "conversation": "6a88…", "sender": "6a88…", "text": "Hello", "createdAt": "2026-08-21T10:25:57.418Z" }
  ],
  "hasMore": true
}
```

**Errors / quirks**

- A non-ObjectId `before` value → **HTTP 500** cast error. The client always
  passes a real message id.
- `sender` is a bare id — names must be resolved from conversation participants.

---

## Messages

### `POST /messages` — send a message

| | |
|---|---|
| Auth | bearer token |
| Purpose | Send to a direct or group conversation |

**Request body**: `{ "conversationId": "6a88…", "text": "Hello!" }`

**Response `200`**: the saved message (same shape as history items).

**Quirks**

- **Empty text is accepted** (HTTP 200) — the client blocks empty/whitespace
  messages itself before calling the API.
- Messages are also broadcast over Socket.io (`message:new`), but the sender
  does **not** receive an echo of their own REST-sent message; the client
  applies its own message optimistically and deduplicates by id just in case.

---

## Groups

### `POST /conversations/group` — create a group

**Request body**: `{ "name": "Project Team", "participantIds": ["6a88…"] }`
(the creator becomes admin and member automatically)

**Response `200`**: full group object (see `GET /conversations` shape) with
populated `participants`.

### `POST /conversations/{id}/participants` — add members (admins only)

**Request body**: `{ "userIds": ["6a88…"] }` → **Response `200`**: updated group object.

### `DELETE /conversations/{id}/participants/{userId}` — remove member / leave

Passing your own id leaves the group. → **Response `200`**: updated group object.

### `POST /conversations/{id}/admins` — promote to admin (admins only)

**Request body**: `{ "userId": "6a88…" }` → **Response `200`**: updated group object.

### `PATCH /conversations/{id}` — rename group (admins only)

**Request body**: `{ "name": "Renamed Team" }` → **Response `200`**: updated group object.

---

## WebSocket (Socket.io)

Connect to the **root origin** with the JWT in the handshake:

```js
const socket = io('https://frontend-task-chatapp.onrender.com', { auth: { token } });
```

An invalid/missing token is rejected at connect time (`connect_error`:
`"Invalid token"`).

### Client → server

- **`message:send`** — payload `{ conversationId, text }`; supports an ack
  callback which resolves `{ ok: true }`.

### Server → client

- **`message:new`** — a new message arrived for you:

  ```json
  { "id": "6a88…", "conversation": "6a88…", "sender": "6a88…", "text": "Hello", "createdAt": 1787308236555 }
  ```

  ⚠️ **Shape differs from REST**: field `id` (not `_id`) and `createdAt` as
  **epoch milliseconds** (not ISO string). The client normalizes both shapes
  into one internal `Message` type.

- **`conversation:updated`** — a group you are in changed (created, renamed,
  members/admins changed). Payload: the full updated conversation object
  (same shape as in `GET /conversations`).

### Realtime notes

- The sender receives **no echo** of their own messages (whether sent via
  REST or socket). The UI adds sent messages from the REST response /
  optimistic state instead.
- Delivery was verified end-to-end: a message POSTed by another user appears
  on connected clients within milliseconds, without polling.

---

## System

### `GET /health` (root origin, not under `/api`)

**Response `200`**: `{ "status": "ok" }`. Note: `/api/health` returns 404.
