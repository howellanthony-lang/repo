# Research: How to Make This Family Organizer 100x Better

_Date: April 24, 2026_

This document turns research into a practical roadmap to move this project from MVP demo to a reliable product for a Raspberry Pi wall display.

## What “100x better” means

For this project, “100x better” should mean:

1. **Actually offline-first** (works when internet drops).
2. **Real calendar interoperability** (Google + iCloud two-way sync).
3. **Kiosk reliability** (boots into app and self-recovers).
4. **Family-grade UX** (touch targets, readability, low-friction use).
5. **Safe local operation** (credentials and auth handled correctly).

---

## Top 10 Highest-Impact Upgrades

## 1) Add true offline sync queue (critical)

**Why:** Current UI depends on live API requests and has no retry queue.

**Research basis:**
- Service Worker API is designed for offline-capable apps and request interception/caching.
- Workbox background sync can queue failed requests and replay later.

**Do next:**
- Add service worker to cache app shell.
- Store writes in IndexedDB queue when API/network unavailable.
- Replay queued mutations when connectivity returns.

Sources:
- MDN Service Worker API: https://developer.mozilla.org/docs/Web/API/Service_Worker_API
- MDN Using Service Workers: https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers.
- Chrome Workbox Background Sync: https://developer.chrome.com/docs/workbox/modules/workbox-background-sync/

## 2) Replace JSON file storage with SQLite + WAL mode

**Why:** JSON file writes are fragile under crash/power loss and concurrent writes.

**Research basis:**
- SQLite WAL mode improves concurrency and durability characteristics.

**Do next:**
- Introduce SQLite schema + migrations.
- Enable `PRAGMA journal_mode=WAL;`.
- Add checkpoint/backup strategy for Pi power events.

Source:
- SQLite WAL docs: https://www.sqlite.org/wal.html

## 3) Implement Google incremental sync correctly

**Why:** Full refresh sync scales badly and creates duplicates/conflicts.

**Research basis:**
- Google Calendar supports incremental synchronization with `syncToken`.

**Do next:**
- Persist per-calendar `syncToken`.
- Build paginated incremental sync worker.
- Handle token invalidation with full resync fallback.

Source:
- Google Calendar sync guide: https://developers.google.com/workspace/calendar/api/guides/sync

## 4) Implement iCloud sync via CalDAV standards

**Why:** Apple calendar support is core requirement.

**Research basis:**
- CalDAV is standardized by RFC 4791.
- Apple supports third-party access patterns and app-specific credentials/authorization paths.

**Do next:**
- Add CalDAV sync module using standards-compliant DAV operations.
- Store event UID + etag to prevent collisions.
- Add iCloud auth configuration flow for third-party access.

Sources:
- RFC 4791 (CalDAV): https://www.rfc-editor.org/rfc/rfc4791.html
- Apple app-specific passwords: https://support.apple.com/en-us/102654
- Apple third-party iCloud access: https://support.apple.com/en-afri/121539

## 5) Add device-code auth UX for TV/kiosk-style login

**Why:** Typing OAuth credentials directly on a wall display is painful.

**Research basis:**
- OAuth 2.0 Device Authorization Grant is specifically for limited-input devices.
- Google documents limited-input device flow.

**Do next:**
- Show user code + verification URL on Pi.
- Pair with phone browser to authorize.
- Poll token endpoint and finish onboarding on-screen.

Sources:
- RFC 8628: https://www.rfc-editor.org/rfc/rfc8628
- Google limited-input OAuth flow: https://developers.google.com/identity/protocols/oauth2/limited-input-device

## 6) Harden Raspberry Pi kiosk boot flow

**Why:** Home displays fail in real life if they don’t auto-recover.

**Research basis:**
- Official Raspberry Pi kiosk setup guidance with Chromium flags and autostart.

**Do next:**
- Use systemd unit for API process.
- Autostart Chromium with kiosk flags.
- Add watchdog/restart policy.

Source:
- Raspberry Pi kiosk tutorial: https://www.raspberrypi.com/tutorials/how-to-use-a-raspberry-pi-in-kiosk-mode/

## 7) Match/beat Dragon Touch baseline features

**Why:** Product benchmark includes chores, meals, grocery, remote app, and photo frame.

**Research basis:**
- Dragon Touch product pages emphasize unified sync, chore charts, meal planner, and photo mode.

**Do next:**
- Add per-member color views, reward stars, and family mode switch.
- Implement slideshow idle mode.
- Build mobile admin mini-web app.

Sources:
- Product page: https://dragontouch.com/products/dragon-touch-digital-calendar
- Product overview page: https://dragontouch.com/pages/digital-calendar

## 8) Improve touch accessibility defaults

**Why:** Wall-mounted interfaces fail quickly if controls are too small.

**Research basis:**
- WCAG 2.2 target-size guidance recommends minimum 24x24 CSS pixels.

**Do next:**
- Set global minimum hit area to >= 44px visual controls.
- Add large-font mode and high-contrast mode.
- Add “today-first” screen with one-tap actions.

Sources:
- WCAG 2.2: https://www.w3.org/TR/WCAG22/
- Target size understanding doc: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum

## 9) Add role-based household auth + secure secret storage

**Why:** Family data and OAuth tokens must be protected.

**Research basis:**
- NIST digital identity guidance emphasizes approved encryption and protected channels.

**Do next:**
- Add local admin PIN and parent/child roles.
- Encrypt provider refresh tokens at rest.
- Rotate/revoke integration tokens from settings.

Source:
- NIST SP 800-63B (current draft site): https://pages.nist.gov/800-63-4/sp800-63b.html

## 10) Integrate with Home Assistant (optional superpower)

**Why:** Huge ecosystem leverage for automations/reminders and smart-home context.

**Research basis:**
- Home Assistant provides calendar entities and automation actions.

**Do next:**
- Publish organizer events to HA calendar entity.
- Pull selected HA calendar streams into household board.

Source:
- Home Assistant Calendar integration: https://www.home-assistant.io/integrations/calendar/

---

## Priority roadmap (implementation order)

### Phase A (1–2 weeks)
- SQLite migration + WAL
- API validation + error model
- Service worker app shell cache
- Kiosk boot hardening on Pi

### Phase B (2–4 weeks)
- Google incremental sync worker (`syncToken`)
- iCloud CalDAV read sync
- Conflict resolution model (server revision + source etag)

### Phase C (4–8 weeks)
- Two-way sync for Google/iCloud
- Device code onboarding UX
- Roles, settings, token encryption

### Phase D (ongoing)
- Rewards/stars system
- Slideshow + ambient mode
- Home Assistant integration

---

## Suggested architecture upgrades from current code

- Split API into modules:
  - `integrations/google/`
  - `integrations/icloud/`
  - `sync/engine/`
  - `storage/sqlite/`
- Introduce event revision fields:
  - `source_uid`, `source_etag`, `local_revision`, `last_synced_at`
- Add background workers:
  - `sync-pull`, `sync-push`, `queue-replay`, `housekeeping`

---

## Success metrics (product-quality)

- Cold boot to usable dashboard: **< 20s**
- Offline write success rate: **100% locally queued**
- Sync conflict unresolved rate: **< 1%**
- Crash recovery (power loss): **no data corruption events**
- Parent task completion time (add event): **< 10s median**

---

## Immediate next ticket list (ready to build)

1. Migrate JSON DB to SQLite with WAL and migration tooling.
2. Add service worker + IndexedDB mutation queue.
3. Add sync tables (`integration_accounts`, `sync_cursors`, `sync_jobs`).
4. Implement Google OAuth device flow onboarding screen.
5. Implement Google incremental event sync worker.
6. Define CalDAV mapper for iCloud VEVENT <-> internal event model.
