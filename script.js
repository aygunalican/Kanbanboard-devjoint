const STATUSES = ['waiting', 'progress', 'done'];


let tasks = [
  { id: 't1', title: 'Design homepage', description: 'Wireframe first', priority: 'medium', status: 'waiting', createdAt: new Date().toISOString() },
  { id: 't2', title: 'Fix login bug', description: '', priority: 'high', status: 'progress', createdAt: new Date().toISOString() },
  { id: 't3', title: 'Write docs', description: 'README update', priority: 'low', status: 'done', createdAt: new Date().toISOString() },
];

const lists = {
  waiting: document.getElementById('list-waiting'),
  progress: document.getElementById('list-progress'),
  done: document.getElementById('list-done'),
};

const counts = {
  waiting: document.getElementById('count-waiting'),
  progress: document.getElementById('count-progress'),
  done: document.getElementById('count-done'),
};

function render() {
  STATUSES.forEach(status => {
    const listEl = lists[status];
    listEl.textContent = '';

    const columnTasks = tasks.filter(t => t.status === status);
    counts[status].textContent = columnTasks.length;

    if (columnTasks.length === 0) {
      const emptyText = document.createElement('div');
      emptyText.className = 'empty-text';
      emptyText.textContent = 'No tasks here';
      listEl.appendChild(emptyText);
      return;
    }

    columnTasks.forEach(task => listEl.appendChild(createTaskCard(task)));
  });
}

function createTaskCard(task) {
  const card = document.createElement('div');
  card.className = 'task-card priority-' + task.priority;
  card.dataset.id = task.id;

  const tag = document.createElement('span');
  tag.className = 'priority-tag ' + task.priority;
  tag.textContent = priorityLabel(task.priority);
  card.appendChild(tag);

  const title = document.createElement('div');
  title.className = 'task-title';
  title.textContent = task.title;
  card.appendChild(title);

  if (task.description) {
    const desc = document.createElement('div');
    desc.className = 'task-desc';
    desc.textContent = task.description;
    card.appendChild(desc);
  }

  const date = document.createElement('div');
  date.className = 'task-date';
  date.textContent = formatDate(task.createdAt);
  card.appendChild(date);

  return card;
}

function priorityLabel(p) {
  if (p === 'low') return 'Low';
  if (p === 'medium') return 'Medium';
  return 'High';
}

function formatDate(iso) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

render();