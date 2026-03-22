let currentFilter = 'all';
let searchQuery = '';
let currentPage = 1;
const pageSize = 5;

async function loadTodos() {
  let url = 'http://localhost:3000/todos';

  const params = [];

  // 状态筛选
  if (currentFilter === 'done') {
    params.push('status=done');
  } else if (currentFilter === 'undone') {
    params.push('status=undone');
  }

  // 搜索关键词
  if (searchQuery) {
    params.push(`search=${encodeURIComponent(searchQuery)}`);
  }

  // 分页参数
  params.push(`page=${currentPage}`);
  params.push(`pageSize=${pageSize}`);

  if (params.length > 0) {
    url += '?' + params.join('&');
  }

  const response = await fetch(url);
  const data = await response.json();

  const todos = data.list;
  const pagination = data.pagination;

  const todoList = document.getElementById('todo-list');
  todoList.innerHTML = '';

  if (todos.length === 0) {
    const li = document.createElement('li');
    li.textContent = '暂无匹配任务';
    li.style.color = '#888';
    li.style.textAlign = 'center';
    todoList.appendChild(li);
  } else {
    todos.forEach(todo => {
      const li = document.createElement('li');

      const span = document.createElement('span');
      span.textContent = todo.done ? `✅ ${todo.text}` : `⭕ ${todo.text}`;
      span.style.cursor = 'pointer';
      span.style.userSelect = 'none';

      if (todo.done) {
        span.style.textDecoration = 'line-through';
        span.style.color = '#888';
      }

      span.addEventListener('click', async () => {
        await toggleTodo(todo.id);
      });

      const btnGroup = document.createElement('div');
      btnGroup.className = 'btn-group';

      const editBtn = document.createElement('button');
      editBtn.textContent = '编辑';
      editBtn.addEventListener('click', async () => {
        await editTodo(todo.id, todo.text);
      });

      const delBtn = document.createElement('button');
      delBtn.textContent = '删除';
      delBtn.addEventListener('click', async () => {
        await deleteTodo(todo.id);
      });

      btnGroup.appendChild(editBtn);
      btnGroup.appendChild(delBtn);

      li.appendChild(span);
      li.appendChild(btnGroup);
      todoList.appendChild(li);
    });
  }

  // 更新分页显示
  document.getElementById('page-info').textContent =
    `第 ${pagination.currentPage} 页 / 共 ${pagination.totalPages || 1} 页`;

  // 控制按钮可用状态
  document.getElementById('prev-page').disabled = pagination.currentPage <= 1;
  document.getElementById('next-page').disabled =
    pagination.currentPage >= pagination.totalPages || pagination.totalPages === 0;
}

// 添加任务
async function addTodo() {
  const input = document.getElementById('main-input');
  const text = input.value.trim();

  if (!text) {
    alert('请输入任务内容');
    return;
  }

  await fetch('http://localhost:3000/todos', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ text })
  });

  input.value = '';
  searchQuery = '';
  currentPage = 1;
  loadTodos();
}

// 搜索任务
function searchTodos() {
  const input = document.getElementById('main-input');
  searchQuery = input.value.trim();
  currentPage = 1;
  loadTodos();
}

// 删除任务
async function deleteTodo(id) {
  await fetch(`http://localhost:3000/todos/${id}`, {
    method: 'DELETE'
  });

  loadTodos();
}

// 切换完成状态
async function toggleTodo(id) {
  await fetch(`http://localhost:3000/todos/${id}`, {
    method: 'PUT'
  });

  loadTodos();
}

// 编辑任务
async function editTodo(id, oldText) {
  const newText = prompt('请输入新的任务内容：', oldText);

  if (newText === null) return;

  const trimmedText = newText.trim();

  if (!trimmedText) {
    alert('任务内容不能为空');
    return;
  }

  await fetch(`http://localhost:3000/todos/${id}/text`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ text: trimmedText })
  });

  loadTodos();
}

// 添加按钮
document.getElementById('add-btn').addEventListener('click', addTodo);

// 搜索按钮
document.getElementById('search-btn').addEventListener('click', searchTodos);

// 回车默认搜索
document.getElementById('main-input').addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    searchTodos();
  }
});

// 筛选按钮
document.getElementById('filter-all').addEventListener('click', () => {
  currentFilter = 'all';
  currentPage = 1;
  loadTodos();
});

document.getElementById('filter-undone').addEventListener('click', () => {
  currentFilter = 'undone';
  currentPage = 1;
  loadTodos();
});

document.getElementById('filter-done').addEventListener('click', () => {
  currentFilter = 'done';
  currentPage = 1;
  loadTodos();
});

// 分页按钮
document.getElementById('prev-page').addEventListener('click', () => {
  if (currentPage > 1) {
    currentPage--;
    loadTodos();
  }
});

document.getElementById('next-page').addEventListener('click', () => {
  currentPage++;
  loadTodos();
});

loadTodos();