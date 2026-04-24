const API_BASE = localStorage.getItem('familyOrganizerApi') || 'http://localhost:3000';

const eventForm = document.getElementById('event-form');
const choreForm = document.getElementById('chore-form');
const mealForm = document.getElementById('meal-form');
const groceryForm = document.getElementById('grocery-form');

const eventList = document.getElementById('event-list');
const choreList = document.getElementById('chore-list');
const mealList = document.getElementById('meal-list');
const groceryList = document.getElementById('grocery-list');

async function api(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

function renderList(target, items, formatter) {
  target.innerHTML = '';
  for (const item of items) {
    const li = document.createElement('li');
    li.textContent = formatter(item);
    target.append(li);
  }
}

async function loadAll() {
  const [events, chores, mealsWeek, groceries] = await Promise.all([
    api('/api/events'),
    api('/api/chores'),
    api('/api/meals/week'),
    api('/api/grocery/items'),
  ]);

  renderList(eventList, events, e => `${e.title} • ${e.owner}`);
  renderList(choreList, chores, c => `${c.title} • ${c.assignee} (${c.status})`);
  renderList(mealList, mealsWeek.meals, m => `${m.date} ${m.meal_type}: ${m.recipe}`);
  renderList(groceryList, groceries, g => `${g.name} x${g.quantity}`);
}

eventForm.addEventListener('submit', async event => {
  event.preventDefault();
  const data = new FormData(eventForm);
  await api('/api/events', {
    method: 'POST',
    body: JSON.stringify(Object.fromEntries(data.entries())),
  });
  eventForm.reset();
  loadAll();
});

choreForm.addEventListener('submit', async event => {
  event.preventDefault();
  const data = new FormData(choreForm);
  await api('/api/chores', {
    method: 'POST',
    body: JSON.stringify(Object.fromEntries(data.entries())),
  });
  choreForm.reset();
  loadAll();
});

mealForm.addEventListener('submit', async event => {
  event.preventDefault();
  const data = new FormData(mealForm);
  const payload = Object.fromEntries(data.entries());
  payload.date = new Date().toISOString().slice(0, 10);
  await api('/api/meals', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  mealForm.reset();
  loadAll();
});

groceryForm.addEventListener('submit', async event => {
  event.preventDefault();
  const data = new FormData(groceryForm);
  await api('/api/grocery/items', {
    method: 'POST',
    body: JSON.stringify(Object.fromEntries(data.entries())),
  });
  groceryForm.reset();
  loadAll();
});

loadAll().catch(error => {
  eventList.innerHTML = `<li>Failed to load: ${error.message}</li>`;
});
