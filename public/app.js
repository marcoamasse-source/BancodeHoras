// To‑Do app com localStorage
// Key no localStorage:
const STORAGE_KEY = 'todo_app_v1';

const form = document.getElementById('todo-form');
const input = document.getElementById('todo-input');
const listEl = document.getElementById('todo-list');
const countEl = document.getElementById('count');
const clearBtn = document.getElementById('clear-completed');
const filterButtons = document.querySelectorAll('.filter');

let todos = []; // {id, text, completed, createdAt}
let filter = 'all'; // all | active | completed

// Carrega do localStorage
function loadTodos(){
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    todos = raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Erro ao carregar todos:', e);
    todos = [];
  }
}

// Salva no localStorage
function saveTodos(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

// Gera id simples
function uid(){
  return Date.now().toString(36) + Math.random().toString(36).slice(2,8);
}

// Renderiza lista conforme filtro
function render(){
  listEl.innerHTML = '';
  const filtered = todos.filter(t => {
    if (filter === 'active') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  if (filtered.length === 0){
    const empty = document.createElement('li');
    empty.className = 'todo-item';
    empty.innerHTML = '<div class="text" style="color:var(--muted)">Nenhuma tarefa</div>';
    listEl.appendChild(empty);
  } else {
    filtered.forEach(todo => {
      const li = document.createElement('li');
      li.className = 'todo-item';
      li.dataset.id = todo.id;

      const check = document.createElement('button');
      check.className = 'check' + (todo.completed ? ' checked' : '');
      check.setAttribute('aria-pressed', String(todo.completed));
      check.title = todo.completed ? 'Marcar como não concluída' : 'Marcar como concluída';
      check.innerHTML = todo.completed ? '✓' : '';

      const text = document.createElement('div');
      text.className = 'text' + (todo.completed ? ' completed' : '');
      text.textContent = todo.text;
      text.title = todo.text;

      const actions = document.createElement('div');
      actions.className = 'actions';

      const editBtn = document.createElement('button');
      editBtn.className = 'icon-btn';
      editBtn.title = 'Editar';
      editBtn.textContent = '✎';

      const delBtn = document.createElement('button');
      delBtn.className = 'icon-btn';
      delBtn.title = 'Excluir';
      delBtn.textContent = '🗑';

      actions.appendChild(editBtn);
      actions.appendChild(delBtn);

      li.appendChild(check);
      li.appendChild(text);
      li.appendChild(actions);
      listEl.appendChild(li);

      // Eventos
      check.addEventListener('click', () => {
        toggleTodo(todo.id);
      });

      delBtn.addEventListener('click', () => {
        deleteTodo(todo.id);
      });

      editBtn.addEventListener('click', () => {
        startEdit(li, todo);
      });
    });
  }

  updateCount();
}

// Adiciona novo
function addTodo(text){
  if (!text || !text.trim()) return;
  todos.unshift({
    id: uid(),
    text: text.trim(),
    completed: false,
    createdAt: new Date().toISOString()
  });
  saveTodos();
  render();
}

// Alterna completo
function toggleTodo(id){
  todos = todos.map(t => t.id === id ? {...t, completed: !t.completed} : t);
  saveTodos();
  render();
}

// Excluir
function deleteTodo(id){
  todos = todos.filter(t => t.id !== id);
  saveTodos();
  render();
}

// Edit in-place
function startEdit(li, todo){
  const textDiv = li.querySelector('.text');
  const inputEdit = document.createElement('input');
  inputEdit.type = 'text';
  inputEdit.value = todo.text;
  inputEdit.className = 'edit';
  li.replaceChild(inputEdit, textDiv);
  inputEdit.focus();

  function finish(){
    const val = inputEdit.value.trim();
    if (val) {
      todos = todos.map(t => t.id === todo.id ? {...t, text: val} : t);
      saveTodos();
    }
    render();
  }

  inputEdit.addEventListener('blur', finish);
  inputEdit.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      inputEdit.blur();
    } else if (e.key === 'Escape') {
      render();
    }
  });
}

// Limpar concluídas
function clearCompleted(){
  todos = todos.filter(t => !t.completed);
  saveTodos();
  render();
}

// Atualiza contador
function updateCount(){
  const remaining = todos.filter(t => !t.completed).length;
  countEl.textContent = `${remaining} tarefa(s) pendente(s) • ${todos.length} no total`;
}

// Eventos do formulário
form.addEventListener('submit', (e) => {
  e.preventDefault();
  addTodo(input.value);
  input.value = '';
  input.focus();
});

clearBtn.addEventListener('click', () => {
  clearCompleted();
});

// Filtros
filterButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    filterButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    filter = btn.dataset.filter;
    render();
  });
});

// Inicialização
loadTodos();
render();
