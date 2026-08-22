# Pulse — Real-time Chat Application

A production-quality, real-time messaging product built for the Senior Frontend Engineer take-home assignment: direct chats, group conversations, live delivery over WebSocket, intelligent auto-scroll, and a creative landing page — all in a responsive, accessible interface.

## Live Demo

🚀 **Live Demo:** https://private-messenger-v1.vercel.app/

- **Landing page:** https://private-messenger-v1.vercel.app/
- **Chat / Login:** https://private-messenger-v1.vercel.app/login

## Features

**Authentication**
- One-step login/registration by phone number + name (per the API design)
- Session persistence across reloads (validated against `GET /auth/me`)
- Loading, validation, and API error states

**Conversations**
- Search users by name and phone number
- Start/open direct conversations
- Group creation and management
- Unread badges and live conversation reordering

**Chat experience**
- Cursor-paginated message history
- Optimistic sending with retry on failure
- Intelligent auto-scroll and new-message indicator
- Responsive and accessible chat interface

**Real-time**
- Shared Socket.io connection with JWT handshake auth
- Incoming messages appear instantly without polling
- Live group updates and automatic reconnection

## Tech Stack

- React 18 + TypeScript
- Vite 6
- Tailwind CSS v4
- Zustand
- Socket.io Client
- React Router 6
- lucide-react
- ESLint 9

## Getting Started

```bash
npm install
cp .env.example .env
npm run dev
```

Production build:

```bash
npm run build
npm run preview
```

## Environment Variables

```env
VITE_API_BASE_URL=https://frontend-task-chatapp.onrender.com
```

`VITE_API_BASE_URL` controls both the REST API origin and the Socket.io origin. Set the correct production API URL in Vercel Environment Variables before deploying.

## Architecture

```text
src/
├── main.tsx / App.tsx
├── lib/
│   ├── config.ts
│   ├── api.ts
│   ├── socket.ts
│   └── utils.ts
├── services/
│   ├── auth.ts
│   ├── users.ts
│   ├── conversations.ts
│   └── messages.ts
├── stores/
│   ├── authStore.ts
│   └── chatStore.ts
├── hooks/
└── features/
```

## API

The frontend is a client-side SPA and communicates with the existing REST + Socket.io backend configured by `VITE_API_BASE_URL`.

Full endpoint reference: [docs/API.md](docs/API.md)

## API Notes

The client contains deliberate workarounds for quirks discovered while integrating with the API, including search regex handling, phone-search limitations, REST/socket payload normalization, missing-token error handling, ObjectId cursor validation, and empty-message prevention.

## GitHub Repository

https://github.com/mohaiminulislamazim-tech/private_messenger_v1

## Deployment

The frontend is deployed on Vercel. Every push to the configured GitHub branch can trigger a new Vercel deployment when Git integration is enabled.
