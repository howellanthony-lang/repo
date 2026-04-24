# Off-Grid Family Organizer (Raspberry Pi)

A runnable starter project for a Raspberry Pi family organizer inspired by Dragon Touch-style wall displays, with core modules for:

- Shared family calendar events
- Chore tracking
- Weekly meal planning
- Grocery list management

This version is an **MVP prototype** with a local API and touch-friendly web UI.

## Project Structure

- `apps/api/server.mjs` — local JSON-backed API (no external DB required)
- `apps/ui/index.html` — kiosk-friendly web dashboard
- `apps/ui/app.js` — browser logic and API integration
- `apps/ui/styles.css` — dashboard styling
- `tests/api.test.mjs` — API test coverage using Node test runner

## Run Locally

From the repo root:

1. Start the API:

```bash
npm run start:api
```

2. In a second terminal, start the UI server:

```bash
npm run start:ui
```

3. Open:

- UI: `http://localhost:5173`
- API health: `http://localhost:3000/api/health`

## Run Tests

```bash
npm test
```

## Implemented API Endpoints

- `GET /api/health`
- `GET /api/events`
- `POST /api/events`
- `GET /api/chores`
- `POST /api/chores`
- `POST /api/chores/:id/complete`
- `GET /api/meals/week`
- `POST /api/meals`
- `GET /api/grocery/items`
- `POST /api/grocery/items`

## Raspberry Pi Kiosk Notes

On Raspberry Pi OS, run the UI in Chromium kiosk mode:

```bash
chromium-browser --kiosk http://localhost:5173
```

For production hardening, next steps are:

- Add authentication and household accounts
- Add Google Calendar OAuth sync
- Add iCloud/CalDAV integration
- Persist data in SQLite/PostgreSQL instead of JSON file
- Add Docker Compose and systemd services for auto-boot

## Deep-dive research roadmap

See `RESEARCH.md` for a source-backed roadmap to make this project production-grade.
