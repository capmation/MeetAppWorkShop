# MeetApp Workshop — AI-Accelerated Build

MeetApp is a real-time video meeting app with chat, public/private rooms, and Google sign-in backed by Firebase (Auth + Firestore). We built the MVP in ~4 hours locally, deployed in ~3 hours, and spent ~2 hours polishing UX/UI—showcasing how quickly you can ship with AI (Claude + GitHub Copilot using GPT-5.1-Codex-Max).

## Why this workshop
- See an end-to-end AI-assisted build (frontend, backend, sockets, WebRTC, auth).
- Learn a repeatable prompt playbook for architecture, coding, UX, security, and testing.
- Leave with a runnable reference project you can extend in class or on stage.

## A note to humans
AI can build faster than any single person; working with it is like pairing with a world-class developer on demand. That does not remove the need for developers—it shifts our role. We still choose the stack, architecture, security posture, budgets, scalability targets, and policies. Poor guidance leads to costly or brittle systems. Delivery timelines compress: what took months can take days or hours (bureaucracy aside). We can even skip standalone design tools and iterate directly in code when we guide AI with a designer-engineer mindset that balances usability, aesthetics, data, and code. Our craft becomes more integrative and multidisciplinary—more about steering, less about rote typing.

## What you will build
- Create and join public or private meetings with shareable links.
- Live video via WebRTC (`simple-peer`) with STUN/TURN support (required for production/NAT).
- Realtime chat via Socket.IO.
- Google login + Firestore persistence via Firebase.
- Clean architecture with Nuxt 4 + Nitro server routes, Pinia stores, and Tailwind UI components.

## Stack at a glance
- Frontend: Nuxt 4 (TypeScript), Tailwind, Pinia, composables for media/socket/auth.
- Realtime: Socket.IO client/server, WebRTC peers; TURN configurable via env.
- Auth/Data: Firebase Auth + Firestore; Firebase Admin on the server for verification.
- Testing: Vitest + Vue Test Utils (unit), Playwright (e2e), Happy DOM.

## Architecture
```mermaid
flowchart LR
	User[Browser] --> Nuxt[Nuxt 4 App]
	Nuxt --> Pinia[Pinia Stores]
	Nuxt --> Components[UI Components]
	Nuxt --> Composables[Media/Auth/Chat/WebRTC]
	Nuxt -->|REST| API[/server/api/*]
	Nuxt -->|WebSocket| SocketClient[(Socket.IO Client)]
	SocketClient <--> SocketServer[(Socket.IO Server)]
	SocketServer --> STUNTURN[(STUN/TURN)]
	Nuxt --> FirebaseAuth[(Firebase Auth)]
	Nuxt --> Firestore[(Firestore)]
	API --> FirebaseAdmin[(Firebase Admin)]
	FirebaseAdmin --> Firestore
```

Folder cues: `app/` (pages, components, composables, stores), `server/` (Nitro routes, middleware, socket plugin), `public/` assets, `tests/` (unit + e2e).

## Time breakdown (realistic for the workshop)
- 4h — MVP local build (UI, sockets, WebRTC glue, Firebase auth).
- 3h — Deploy to server (Render/any Node host, sockets + TURN config).
- 2h — UX/UI refinement (layout, controls, states, polish).

## Prerequisites
- Node 18+ recommended.
- npm (or pnpm/yarn) installed.
- Firebase project with Web credentials and a service account for admin SDK.
- STUN/TURN service for production (e.g., metered.ca free tier) and a public Socket.IO endpoint.

## Environment variables
Create `.env` (or configure in your hosting platform):

```
NUXT_PUBLIC_FIREBASE_API_KEY=
NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NUXT_PUBLIC_FIREBASE_PROJECT_ID=
NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NUXT_PUBLIC_FIREBASE_APP_ID=

NUXT_PUBLIC_SOCKET_URL=http://localhost:4001   # prod: your deployed URL
NUXT_PUBLIC_TURN_HOST=                          # e.g. turn.metered.ca:443
NUXT_PUBLIC_TURN_USERNAME=
NUXT_PUBLIC_TURN_CREDENTIAL=

FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

## Run locally
1) Install deps: `npm install`
2) Start sockets/API + client: `npm run dev` (Nuxt dev server handles both via Nitro)
3) Open http://localhost:3000

## Test and lint
- Unit: `npm run test`
- E2E: `npm run test:e2e`
- Lint: `npm run lint`

## Deploy notes
- Host as a Node app (Nuxt Nitro). Ensure `NUXT_PUBLIC_SOCKET_URL` points to the public URL.
- Provision a TURN server for reliable media (especially behind NAT/firewalls).
- Secure env vars in your platform; never commit secrets.

## AI build playbook (what we used)
- Tooling: Claude + GitHub Copilot (GPT-5.1-Codex-Max) for code, refactors, and docs.
- Workflow: alternate high-level architecture prompts with focused coding prompts; keep a running checklist of risks (media permissions, TURN, auth flows, chat ordering, sanitization).

### Ready-to-use prompts
- Architecture prompt: “Design a clean Nuxt 4 app for video meetings with Socket.IO and WebRTC peers. Separate composables for media, chat, sockets; Pinia stores for auth/meeting state; Nitro server routes for meetings CRUD and verification; include TURN configurability. Provide a simple folder map and data flow.”
- Developer prompt: “Implement a Meeting store that syncs with Socket.IO events (join/leave/chat), persists Firestore metadata, and handles reconnection. Give TypeScript-safe actions, loading/error states, and optimistic updates.”
- UX prompt: “Refine meeting UI: lobby view, in-call controls (mute, camera, screen share), participant grid, chat panel, toasts for join/leave. Add empty/loading states and keyboard shortcuts. Keep Tailwind utility classes balanced and accessible.”
- Security prompt: “List the auth/session risks for a Socket.IO + Firebase app. Enforce token verification on connect, sanitize chat, rate-limit meeting creation, and set safe headers. Suggest server middleware for auth.”
- Testing prompt: “Write Vitest + Vue Test Utils cases for media controls and chat store; mock `simple-peer`. Add Playwright scenarios: login, create private meeting, invite second user, exchange messages, toggle media, and leave.”

## Workshop flow suggestion
- 15m: Architecture walkthrough (diagram + folder map).
- 30m: Guided coding sprint (auth + sockets + media composable).
- 20m: UX polish session.
- 15m: Security checks and TURN wiring.
- 20m: Testing + e2e demo.
- 10m: Deploy + retro.

## Tips for smooth demos
- Warm up Firebase credentials and TURN config beforehand.
- Test with two browser profiles to show media + chat.
- Keep console open to highlight socket and WebRTC signaling.
- Have fallback slides with the diagram and the prompt playbook.

## Credits
Built with Nuxt, Tailwind, Socket.IO, simple-peer, Firebase, and a lot of help from Claude + GitHub Copilot (GPT-5.1-Codex-Max).
Created by Nicolás Vela from Isabela, Galápagos, Ecuador.
