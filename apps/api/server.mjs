import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const defaultDataDir = join(__dirname, 'data');
const defaultDbPath = join(defaultDataDir, 'db.json');

const initialDb = {
  events: [],
  chores: [],
  meals: [],
  grocery_items: [],
};

function ensureDb(dbPath) {
  const dir = dirname(dbPath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  if (!existsSync(dbPath)) writeFileSync(dbPath, JSON.stringify(initialDb, null, 2));
}

function readDb(dbPath) {
  ensureDb(dbPath);
  return JSON.parse(readFileSync(dbPath, 'utf8'));
}

function writeDb(dbPath, db) {
  writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(payload));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';

    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1_000_000) reject(new Error('Body too large'));
    });

    req.on('end', () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
  });
}

function validateRequired(payload, fields) {
  const missing = fields.filter(field => {
    const value = payload[field];
    return typeof value !== 'string' || value.trim().length === 0;
  });

  return missing.length > 0 ? `Missing required fields: ${missing.join(', ')}` : null;
}

function isoWeekRange(date = new Date()) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 1 - day);
  const start = d.toISOString().slice(0, 10);
  d.setUTCDate(d.getUTCDate() + 6);
  const end = d.toISOString().slice(0, 10);
  return { start, end };
}

function buildApiServer({ dbPath = defaultDbPath } = {}) {
  return createServer(async (req, res) => {
    try {
      if (!req.url) return sendJson(res, 404, { error: 'Not found' });

      if (req.method === 'OPTIONS') {
        res.writeHead(204, {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        });
        return res.end();
      }

      const url = new URL(req.url, 'http://localhost');
      const db = readDb(dbPath);

      if (req.method === 'GET' && url.pathname === '/api/health') {
        return sendJson(res, 200, { ok: true, service: 'family-organizer-api' });
      }

      if (req.method === 'GET' && url.pathname === '/api/events') {
        return sendJson(res, 200, db.events);
      }

      if (req.method === 'POST' && url.pathname === '/api/events') {
        const payload = await parseBody(req);
        const validationError = validateRequired(payload, ['title', 'owner']);
        if (validationError) return sendJson(res, 400, { error: validationError });

        const event = {
          id: randomUUID(),
          title: payload.title.trim(),
          owner: payload.owner.trim(),
          source: payload.source ?? 'local',
          start: payload.start ?? new Date().toISOString(),
          end: payload.end ?? new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString(),
        };

        db.events.push(event);
        writeDb(dbPath, db);
        return sendJson(res, 201, event);
      }

      if (req.method === 'PATCH' && url.pathname.match(/^\/api\/events\/[^/]+$/)) {
        const eventId = url.pathname.split('/')[3];
        const payload = await parseBody(req);
        const event = db.events.find(item => item.id === eventId);
        if (!event) return sendJson(res, 404, { error: 'Event not found' });

        const updates = ['title', 'owner', 'start', 'end', 'source'];
        for (const field of updates) {
          if (typeof payload[field] === 'string' && payload[field].trim().length > 0) {
            event[field] = payload[field].trim();
          }
        }

        event.updated_at = new Date().toISOString();
        writeDb(dbPath, db);
        return sendJson(res, 200, event);
      }

      if (req.method === 'GET' && url.pathname === '/api/chores') {
        return sendJson(res, 200, db.chores);
      }

      if (req.method === 'POST' && url.pathname === '/api/chores') {
        const payload = await parseBody(req);
        const validationError = validateRequired(payload, ['title', 'assignee']);
        if (validationError) return sendJson(res, 400, { error: validationError });

        const chore = {
          id: randomUUID(),
          title: payload.title.trim(),
          assignee: payload.assignee.trim(),
          due_date: payload.due_date ?? new Date().toISOString().slice(0, 10),
          points: Number(payload.points ?? 1),
          status: 'open',
          created_at: new Date().toISOString(),
        };

        db.chores.push(chore);
        writeDb(dbPath, db);
        return sendJson(res, 201, chore);
      }

      if (req.method === 'POST' && url.pathname.match(/^\/api\/chores\/[^/]+\/complete$/)) {
        const choreId = url.pathname.split('/')[3];
        const chore = db.chores.find(item => item.id === choreId);
        if (!chore) return sendJson(res, 404, { error: 'Chore not found' });

        chore.status = 'done';
        chore.completed_at = new Date().toISOString();
        writeDb(dbPath, db);
        return sendJson(res, 200, chore);
      }

      if (req.method === 'GET' && url.pathname === '/api/meals/week') {
        const { start, end } = isoWeekRange();
        const meals = db.meals.filter(m => m.date >= start && m.date <= end);
        return sendJson(res, 200, { range: { start, end }, meals });
      }

      if (req.method === 'POST' && url.pathname === '/api/meals') {
        const payload = await parseBody(req);
        if (typeof payload.recipe !== 'string' || payload.recipe.trim().length === 0) {
          return sendJson(res, 400, { error: 'Missing required fields: recipe' });
        }

        const meal = {
          id: randomUUID(),
          date: payload.date ?? new Date().toISOString().slice(0, 10),
          meal_type: payload.meal_type ?? 'dinner',
          recipe: payload.recipe.trim(),
          notes: payload.notes ?? '',
        };

        db.meals.push(meal);
        writeDb(dbPath, db);
        return sendJson(res, 201, meal);
      }

      if (req.method === 'GET' && url.pathname === '/api/grocery/items') {
        return sendJson(res, 200, db.grocery_items);
      }

      if (req.method === 'POST' && url.pathname === '/api/grocery/items') {
        const payload = await parseBody(req);
        if (typeof payload.name !== 'string' || payload.name.trim().length === 0) {
          return sendJson(res, 400, { error: 'Missing required fields: name' });
        }

        const item = {
          id: randomUUID(),
          name: payload.name.trim(),
          quantity: payload.quantity ?? '1',
          checked: false,
          created_at: new Date().toISOString(),
        };

        db.grocery_items.push(item);
        writeDb(dbPath, db);
        return sendJson(res, 201, item);
      }

      if (req.method === 'PATCH' && url.pathname.match(/^\/api\/grocery\/items\/[^/]+$/)) {
        const itemId = url.pathname.split('/')[4];
        const payload = await parseBody(req);
        const item = db.grocery_items.find(entry => entry.id === itemId);
        if (!item) return sendJson(res, 404, { error: 'Grocery item not found' });

        if (typeof payload.checked === 'boolean') item.checked = payload.checked;
        if (typeof payload.quantity === 'string' && payload.quantity.trim().length > 0) {
          item.quantity = payload.quantity.trim();
        }
        if (typeof payload.name === 'string' && payload.name.trim().length > 0) {
          item.name = payload.name.trim();
        }

        item.updated_at = new Date().toISOString();
        writeDb(dbPath, db);
        return sendJson(res, 200, item);
      }

      return sendJson(res, 404, { error: 'Not found' });
    } catch (error) {
      return sendJson(res, 400, { error: error.message });
    }
  });
}

function startServer({ port = Number(process.env.PORT ?? 3000), dbPath = defaultDbPath } = {}) {
  const server = buildApiServer({ dbPath });
  return new Promise(resolve => {
    server.listen(port, () => {
      console.log(`Family organizer API listening on http://localhost:${port}`);
      resolve(server);
    });
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}

export { buildApiServer, startServer, defaultDbPath };
