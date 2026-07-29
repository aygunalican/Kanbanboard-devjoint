const STATUSES = ['waiting', 'progress', 'done'];
const STORAGE_KEY = 'kanban_tasks';

let tasks = [];

let pendingDeleteId = null;
let draggedId = null;

const addTaskBtn = document.getElementById('addTaskBtn');
const modalOverlay = document.getElementById('modalOverlay');
const modalTitle = document.getElementById('modalTitle');
const modalClose = document.getElementById('modalClose');
const cancelBtn = document.getElementById('cancelBtn');
const taskForm = document.getElementById('taskForm');
const taskIdInput = document.getElementById('taskId');
const taskTitleInput = document.getElementById('taskTitle');
const titleError = document.getElementById('titleError');
const taskDescInput = document.getElementById('taskDesc');
const taskPriorityInput = document.getElementById('taskPriority');
const taskStatusInput = document.getElementById('taskStatus');
const toast = document.getElementById('toast');

const confirmOverlay = document.getElementById('confirmOverlay');
const confirmMessage = document.getElementById('confirmMessage');
const confirmCancelBtn = document.getElementById('confirmCancelBtn');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

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

function generateId() {
    return 'task_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
}
function loadTasks() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];

        return parsed
            .filter(t => t && typeof t.id === 'string' && typeof t.title === 'string')
            .map(t => ({
                id: t.id,
                title: t.title,
                description: typeof t.description === 'string' ? t.description : '',
                priority: ['low', 'medium', 'high'].includes(t.priority) ? t.priority : 'low',
                status: STATUSES.includes(t.status) ? t.status : 'waiting',
                createdAt: typeof t.createdAt === 'string' ? t.createdAt : new Date().toISOString(),
            }));
    } catch (error) {
        return [];
    }
}

function saveTasks() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (error) {
        showToast('Could not save to storage.', true);
    }
}

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

    const top = document.createElement('div');
    top.className = 'task-top';

    const tag = document.createElement('span');
    tag.className = 'priority-tag ' + task.priority;
    tag.textContent = priorityLabel(task.priority);
    top.appendChild(tag);

    const actions = document.createElement('div');
    actions.className = 'task-actions';

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => openModal(task.id));

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => openConfirm(task.id));

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
    top.appendChild(actions);
    card.appendChild(top);

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

    card.draggable = true;

    card.addEventListener('dragstart', () => {
        draggedId = task.id;
        card.classList.add('dragging');
    });

    card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        draggedId = null;
    });

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

STATUSES.forEach(status => {
    const listEl = lists[status];

    listEl.addEventListener('dragover', e => {
        e.preventDefault();
        listEl.classList.add('drag-over');
    });

    listEl.addEventListener('dragleave', () => {
        listEl.classList.remove('drag-over');
    });

    listEl.addEventListener('drop', e => {
        e.preventDefault();
        listEl.classList.remove('drag-over');
        if (!draggedId) return;
        moveTask(draggedId, status);
    });
});

function moveTask(id, newStatus) {
    const task = tasks.find(t => t.id === id);
    if (!task || task.status === newStatus) return;
    task.status = newStatus;
    saveTasks();
    render();
}

STATUSES.forEach(status => {
    const listEl = lists[status];

    listEl.addEventListener('dragover', e => {
        e.preventDefault();
        listEl.classList.add('drag-over');
    });

    listEl.addEventListener('dragleave', () => {
        listEl.classList.remove('drag-over');
    });

    listEl.addEventListener('drop', e => {
        e.preventDefault();
        listEl.classList.remove('drag-over');
        if (!draggedId) return;
        moveTask(draggedId, status);
    });
});

function moveTask(id, newStatus) {
    const task = tasks.find(t => t.id === id);
    if (!task || task.status === newStatus) return;
    task.status = newStatus;
    render();
}


function openConfirm(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    pendingDeleteId = id;
    confirmMessage.textContent = 'Delete "' + task.title + '"?';
    confirmOverlay.classList.add('open');
}

function closeConfirm() {
    pendingDeleteId = null;
    confirmOverlay.classList.remove('open');
}

confirmCancelBtn.addEventListener('click', closeConfirm);

confirmDeleteBtn.addEventListener('click', () => {
    if (!pendingDeleteId) return;
    tasks = tasks.filter(t => t.id !== pendingDeleteId);
    saveTasks();
    render();
    showToast('Task deleted.');
    closeConfirm();
});

confirmOverlay.addEventListener('click', e => {
    if (e.target === confirmOverlay) closeConfirm();
});

function openModal(id) {
    taskForm.reset();
    titleError.textContent = '';
    taskTitleInput.classList.remove('invalid');

    if (id) {
        const task = tasks.find(t => t.id === id);
        if (!task) return;
        modalTitle.textContent = 'Edit Task';
        taskIdInput.value = task.id;
        taskTitleInput.value = task.title;
        taskDescInput.value = task.description;
        taskPriorityInput.value = task.priority;
        taskStatusInput.value = task.status;
    } else {
        modalTitle.textContent = 'New Task';
        taskIdInput.value = '';
        taskPriorityInput.value = 'low';
        taskStatusInput.value = 'waiting';
    }

    modalOverlay.classList.add('open');
    taskTitleInput.focus();
}

function closeModal() {
    modalOverlay.classList.remove('open');
}

addTaskBtn.addEventListener('click', () => openModal(null));
modalClose.addEventListener('click', closeModal);
cancelBtn.addEventListener('click', closeModal);

modalOverlay.addEventListener('click', e => {
    if (e.target === modalOverlay) closeModal();
});

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        if (modalOverlay.classList.contains('open')) closeModal();
        if (confirmOverlay.classList.contains('open')) closeConfirm();
    }
});

taskForm.addEventListener('submit', e => {
    e.preventDefault();

    const title = taskTitleInput.value.trim();
    const id = taskIdInput.value || null;

    if (!title) {
        titleError.textContent = 'Title cannot be empty.';
        taskTitleInput.classList.add('invalid');
        return;
    }

    titleError.textContent = '';
    taskTitleInput.classList.remove('invalid');

    const description = taskDescInput.value.trim();
    const priority = taskPriorityInput.value;
    const status = taskStatusInput.value;

    if (id) {
        const task = tasks.find(t => t.id === id);
        if (task) {
            task.title = title;
            task.description = description;
            task.priority = priority;
            task.status = status;
        }
        showToast('Task updated.');
    } else {
        tasks.push({
            id: generateId(),
            title,
            description,
            priority,
            status,
            createdAt: new Date().toISOString(),
        });
        showToast('Task added.');
    }
    saveTasks();
    render();
    closeModal();
});

let toastTimer = null;
function showToast(message, isError) {
    toast.textContent = message;
    toast.classList.toggle('error', !!isError);
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2000);
}

tasks = loadTasks();
render();