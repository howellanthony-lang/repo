# Off-Grid Family Organizer (Raspberry Pi)

This project is a practical blueprint for building a **wall-mounted family organizer** on a Raspberry Pi, inspired by products like Dragon Touch, while keeping your data private and your home hub usable even when internet is unreliable.

## Goals

- Shared family calendar view on a touchscreen
- Sync with:
  - **Apple/iCloud calendars** (via CalDAV app-specific password)
  - **Google Calendar** (OAuth)
- Family features:
  - Chore chart with points/stars
  - Meal planner
  - Grocery list
  - Family reminders
  - Photo slideshow when idle
- Offline-first behavior for local use
- Simple mobile access for parents/admins

## Product-Inspired Feature Parity

Inspired by Dragon Touch style capabilities:

- Unified view of multiple calendars
- Color coding per family member
- Chores and meal planning in one screen
- Remote updates from phone/web
- Digital photo frame mode

## Recommended Hardware

- Raspberry Pi 5 (preferred) or Pi 4 (4GB+)
- 32GB+ microSD (or SSD for better durability)
- 15.6"+ 1080p touchscreen display (VESA mount if wall mounted)
- Stable power supply (UPS HAT optional)
- Optional: frame/enclosure for kitchen wall setup

## Software Architecture

### 1) Frontend (kiosk touch UI)

- **Framework:** React + Vite
- **UI:** Full-screen PWA styled for “at-a-glance” readability
- **Modes:**
  - Month/Week/Day calendar
  - Chores board
  - Meal plan + grocery list
  - Idle photo frame mode

### 2) Backend API

- **Framework:** Node.js (Fastify or Express)
- **DB:** SQLite (simple, local, durable) + periodic backups
- **Jobs:** Background scheduler for sync and reminders

### 3) Calendar Sync Layer

- **Google Calendar:** Google Calendar API (incremental sync)
- **Apple Calendar:** CalDAV clients against iCloud
- **Conflict strategy:** “last write wins” with edit audit trail
- **Offline behavior:** queue local changes and sync when internet returns

### 4) Local Deployment

- Docker Compose (frontend, api, db volume)
- Auto-start on boot
- Chromium kiosk mode launching local UI

## Data Model (MVP)

- `users` (name, role, color)
- `households`
- `events` (title, start/end, source, owner)
- `chores` (title, assignee, due date, points, status)
- `meals` (date, meal type, recipe, notes)
- `grocery_items` (name, quantity, checked)
- `photos` (path, caption, created_at)
- `sync_accounts` (provider, tokens/secrets metadata)

## Security & Privacy

- Keep organizer accessible only on home LAN by default
- Encrypt credentials at rest
- Use app-specific passwords for iCloud
- Use OAuth refresh-token storage best practices
- Optional Tailscale for secure remote access (instead of open ports)

## Build Plan (Phased)

### Phase 1 — Core Calendar Board

- Pi boots directly into touchscreen dashboard
- Add household + family member color coding
- Local-only calendar CRUD

### Phase 2 — External Calendar Sync

- Google account connect/disconnect
- iCloud CalDAV connect/disconnect
- Pull + push sync with background retries

### Phase 3 — Family Operations Features

- Chore chart + points rewards
- Meal planner + reusable meals
- Grocery list with quick-add templates

### Phase 4 — Household Polish

- Idle photo frame slideshow
- Large-font accessibility mode
- Notification sounds and visual alerts
- Backup/restore from USB or NAS

## Suggested API Endpoints

- `GET /api/events`
- `POST /api/events`
- `PATCH /api/events/:id`
- `GET /api/chores`
- `POST /api/chores/:id/complete`
- `GET /api/meals/week`
- `POST /api/grocery/items`
- `POST /api/integrations/google/connect`
- `POST /api/integrations/icloud/connect`
- `POST /api/sync/run`

## Raspberry Pi Kiosk Setup (Example)

1. Install Raspberry Pi OS Lite or Desktop.
2. Install Docker + Docker Compose plugin.
3. Configure auto-login and disable screen sleep.
4. Launch Chromium in kiosk mode:
   - `chromium-browser --kiosk http://localhost:5173`
5. Configure systemd service for auto-restart.

## UX Guidance for Family Readability

- Use large cards and low-density text
- Keep core actions to one tap
- Color per person should be consistent everywhere
- Make “Today” view default at startup
- Always keep a quick “Add Event” action visible

## Next Step

If you want, the next commit can scaffold the actual app with:

- `apps/ui` (React kiosk interface)
- `apps/api` (sync + CRUD backend)
- `infra/docker-compose.yml`

This README gives a complete implementation target so development can start immediately.
