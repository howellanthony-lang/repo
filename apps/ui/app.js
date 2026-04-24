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
    const details = await response.json().catch(() => ({ error: `API error: ${response.status}` }));
    throw new Error(details.error || `API error: ${response.status}`);
  }

  return response.json();
}

function createActionButton(label, onClick) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'small-btn';
  button.textContent = label;
  button.addEventListener('click', onClick);
  return button;
}

function renderEvents(items) {
  eventList.innerHTML = '';
  for (const item of items) {
    const li = document.createElement('li');
    li.textContent = `${item.title} • ${item.owner}`;
    eventList.append(li);
  }
}

function renderMeals(items) {
  mealList.innerHTML = '';
  for (const item of items) {
    const li = document.createElement('li');
    li.textContent = `${item.date} ${item.meal_type}: ${item.recipe}`;
    mealList.append(li);
  }
}

function renderChores(items) {
  choreList.innerHTML = '';
  for (const item of items) {
    const li = document.createElement('li');
    li.className = item.status === 'done' ? 'done' : '';

    const text = document.createElement('span');
    text.textContent = `${item.title} • ${item.assignee} (${item.status})`;
    li.append(text);

    if (item.status !== 'done') {
      li.append(
        createActionButton('Complete', async () => {
          await api(`/api/chores/${item.id}/complete`, { method: 'POST' });
          await loadAll();
        }),
      );
    }

    choreList.append(li);
  }
}

function renderGroceries(items) {
  groceryList.innerHTML = '';
  for (const item of items) {
    const li = document.createElement('li');
    li.className = item.checked ? 'done' : '';

    const text = document.createElement('span');
    text.textContent = `${item.name} x${item.quantity}`;
    li.append(text);

    li.append(
      createActionButton(item.checked ? 'Uncheck' : 'Check', async () => {
        await api(`/api/grocery/items/${item.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ checked: !item.checked }),
        });
        await loadAll();
      }),
    );

    groceryList.append(li);
  }
}

async function loadAll() {
  const [events, chores, mealsWeek, groceries] = await Promise.all([
    api('/api/events'),
    api('/api/chores'),
    api('/api/meals/week'),
    api('/api/grocery/items'),
  ]);

  renderEvents(events);
  renderChores(chores);
  renderMeals(mealsWeek.meals);
  renderGroceries(groceries);
}

eventForm.addEventListener('submit', async event => {
  event.preventDefault();
  const data = new FormData(eventForm);
  await api('/api/events', {
    method: 'POST',
    body: JSON.stringify(Object.fromEntries(data.entries())),
  });
  eventForm.reset();
  await loadAll();
});

choreForm.addEventListener('submit', async event => {
  event.preventDefault();
  const data = new FormData(choreForm);
  await api('/api/chores', {
    method: 'POST',
    body: JSON.stringify(Object.fromEntries(data.entries())),
  });
  choreForm.reset();
  await loadAll();
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
  await loadAll();
});

groceryForm.addEventListener('submit', async event => {
  event.preventDefault();
  const data = new FormData(groceryForm);
  await api('/api/grocery/items', {
    method: 'POST',
    body: JSON.stringify(Object.fromEntries(data.entries())),
  });
  groceryForm.reset();
  await loadAll();
});

loadAll().catch(error => {
  eventList.innerHTML = `<li>Failed to load: ${error.message}</li>`;
});
