import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { startServer } from '../apps/api/server.mjs';

async function withServer(run) {
  const tempRoot = mkdtempSync(join(tmpdir(), 'family-api-test-'));
  const dbPath = join(tempRoot, 'db.json');
  const server = await startServer({ port: 0, dbPath });
  const address = server.address();
  const base = `http://127.0.0.1:${address.port}`;

  try {
    await run(base);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
}

test('health endpoint returns ok', async () => {
  await withServer(async base => {
    const response = await fetch(`${base}/api/health`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.ok, true);
  });
});

test('event create and list', async () => {
  await withServer(async base => {
    const create = await fetch(`${base}/api/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Dentist', owner: 'Dad' }),
    });

    assert.equal(create.status, 201);

    const events = await fetch(`${base}/api/events`).then(r => r.json());
    assert.equal(events.length, 1);
    assert.equal(events[0].title, 'Dentist');
  });
});

test('validation returns 400 on missing required fields', async () => {
  await withServer(async base => {
    const response = await fetch(`${base}/api/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'No owner' }),
    });

    const body = await response.json();
    assert.equal(response.status, 400);
    assert.match(body.error, /owner/);
  });
});

test('complete chore updates status', async () => {
  await withServer(async base => {
    const created = await fetch(`${base}/api/chores`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Take out trash', assignee: 'Alex' }),
    }).then(r => r.json());

    const completed = await fetch(`${base}/api/chores/${created.id}/complete`, {
      method: 'POST',
    });

    const body = await completed.json();
    assert.equal(completed.status, 200);
    assert.equal(body.status, 'done');
  });
});
