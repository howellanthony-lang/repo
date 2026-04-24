import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dataDir = join(__dirname, 'data');
const dbPath = join(dataDir, 'db.json');

const initialDb = {
  events: [],
  chores: [],
  meals: [],
  grocery_items: [],
};

function ensureDb() {
  if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
  if (!existsSync(dbPath)) writeFileSync(dbPath, JSON.stringify(initialDb, null, 2));
}

function readDb() {
  ensureDb();
  return JSON.parse(readFileSync(dbPath, 'utf8'));
}

function writeDb(db) {
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

function notFound(res) {
  sendJson(res, 404, { error: 'Not found' });
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1e6) {
        reject(new Error('Body too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
  });
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

const server = createServer(async (req, res) => {
  if (!req.url) return notFound(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    return res.end();
  }

  const url = new URL(req.url, 'http://localhost');
  const db = readDb();

  if (req.method === 'GET' && url.pathname === '/api/health') {
    return sendJson(res, 200, { ok: true, service: 'family-organizer-api' });
  }

  if (req.method === 'GET' && url.pathname === '/api/events') {
    return sendJson(res, 200, db.events);
  }

  if (req.method === 'POST' && url.pathname === '/api/events') {
    const payload = await parseBody(req).catch(err => sendJson(res, 400, { error: err.message }));
    if (!payload || res.writableEnded) return;

    const event = {
      id: randomUUID(),
      title: payload.title ?? 'Untitled',
      owner: payload.owner ?? 'Family',
      source: payload.source ?? 'local',
      start: payload.start ?? new Date().toISOString(),
      end: payload.end ?? new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
    };

    db.events.push(event);
    writeDb(db);
    return sendJson(res, 201, event);
  }

  if (req.method === 'GET' && url.pathname === '/api/chores') {
    return sendJson(res, 200, db.chores);
  }

  if (req.method === 'POST' && url.pathname === '/api/chores') {
    const payload = await parseBody(req).catch(err => sendJson(res, 400, { error: err.message }));
    if (!payload || res.writableEnded) return;

    const chore = {
      id: randomUUID(),
      title: payload.title ?? 'Untitled chore',
      assignee: payload.assignee ?? 'Unassigned',
      due_date: payload.due_date ?? new Date().toISOString().slice(0, 10),
      points: Number(payload.points ?? 1),
      status: 'open',
      created_at: new Date().toISOString(),
    };

    db.chores.push(chore);
    writeDb(db);
    return sendJson(res, 201, chore);
  }

  if (req.method === 'POST' && url.pathname.match(/^\/api\/chores\/[^/]+\/complete$/)) {
    const choreId = url.pathname.split('/')[3];
    const chore = db.chores.find(item => item.id === choreId);
    if (!chore) return sendJson(res, 404, { error: 'Chore not found' });

    chore.status = 'done';
    chore.completed_at = new Date().toISOString();
    writeDb(db);
    return sendJson(res, 200, chore);
  }

  if (req.method === 'GET' && url.pathname === '/api/meals/week') {
    const { start, end } = isoWeekRange();
    const meals = db.meals.filter(m => m.date >= start && m.date <= end);
    return sendJson(res, 200, { range: { start, end }, meals });
  }

  if (req.method === 'POST' && url.pathname === '/api/meals') {
    const payload = await parseBody(req).catch(err => sendJson(res, 400, { error: err.message }));
    if (!payload || res.writableEnded) return;

    const meal = {
      id: randomUUID(),
      date: payload.date ?? new Date().toISOString().slice(0, 10),
      meal_type: payload.meal_type ?? 'dinner',
      recipe: payload.recipe ?? 'TBD',
      notes: payload.notes ?? '',
    };

    db.meals.push(meal);
    writeDb(db);
    return sendJson(res, 201, meal);
  }

  if (req.method === 'GET' && url.pathname === '/api/grocery/items') {
    return sendJson(res, 200, db.grocery_items);
  }

  if (req.method === 'POST' && url.pathname === '/api/grocery/items') {
    const payload = await parseBody(req).catch(err => sendJson(res, 400, { error: err.message }));
    if (!payload || res.writableEnded) return;

    const item = {
      id: randomUUID(),
      name: payload.name ?? 'New item',
      quantity: payload.quantity ?? '1',
      checked: false,
      created_at: new Date().toISOString(),
    };

    db.grocery_items.push(item);
    writeDb(db);
    return sendJson(res, 201, item);
  }

  return notFound(res);
});

const PORT = Number(process.env.PORT ?? 3000);
server.listen(PORT, () => {
  console.log(`Family organizer API listening on http://localhost:${PORT}`);
});
