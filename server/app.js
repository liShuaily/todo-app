const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const db = new sqlite3.Database('./todo.db', (err) => {
  if (err) {
    console.error('数据库连接失败:', err.message);
  } else {
    console.log('数据库连接成功');
  }
});

// 创建 todos 表
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS todos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT NOT NULL,
      done INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    )
  `);
});

// 首页测试接口
app.get('/', (req, res) => {
  res.send('后端服务器启动成功');
});

// 获取任务列表：按创建时间倒序排列，最新的在最上面
app.get('/todos', (req, res) => {
  const { status, search, page = 1, pageSize = 5 } = req.query;

  const currentPage = Number(page);
  const size = Number(pageSize);
  const offset = (currentPage - 1) * size;

  let whereSql = '';
  let params = [];

  // 状态筛选
  if (status === 'done') {
    whereSql += whereSql ? ' AND done = ?' : ' WHERE done = ?';
    params.push(1);
  } else if (status === 'undone') {
    whereSql += whereSql ? ' AND done = ?' : ' WHERE done = ?';
    params.push(0);
  }

  // 搜索关键词
  if (search) {
    whereSql += whereSql ? ' AND text LIKE ?' : ' WHERE text LIKE ?';
    params.push(`%${search}%`);
  }

  // 先查总数
  const countSql = `SELECT COUNT(*) AS total FROM todos${whereSql}`;

  db.get(countSql, params, (err, countRow) => {
    if (err) {
      return res.status(500).json({ message: '读取任务总数失败' });
    }

    const total = countRow.total;
    const totalPages = Math.ceil(total / size);

    // 再查当前页数据
    const dataSql = `
      SELECT * FROM todos
      ${whereSql}
      ORDER BY datetime(created_at) DESC
      LIMIT ? OFFSET ?
    `;

    const dataParams = [...params, size, offset];

    db.all(dataSql, dataParams, (err, rows) => {
      if (err) {
        return res.status(500).json({ message: '读取任务失败' });
      }

      res.json({
        list: rows,
        pagination: {
          total,
          currentPage,
          pageSize: size,
          totalPages
        }
      });
    });
  });
});

// 添加任务
app.post('/todos', (req, res) => {
  const { text } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ message: '任务内容不能为空' });
  }

  const createdAt = new Date().toISOString();

  const sql = 'INSERT INTO todos (text, done, created_at) VALUES (?, ?, ?)';
  db.run(sql, [text.trim(), 0, createdAt], function (err) {
    if (err) {
      return res.status(500).json({ message: '任务添加失败' });
    }

    res.status(201).json({
      id: this.lastID,
      text: text.trim(),
      done: 0,
      created_at: createdAt
    });
  });
});

// 删除任务
app.delete('/todos/:id', (req, res) => {
  const id = Number(req.params.id);

  db.run('DELETE FROM todos WHERE id = ?', [id], function (err) {
    if (err) {
      return res.status(500).json({ message: '任务删除失败' });
    }

    res.json({ message: '删除成功' });
  });
});

// 切换任务完成状态
app.put('/todos/:id', (req, res) => {
  const id = Number(req.params.id);

  db.run(
    'UPDATE todos SET done = CASE WHEN done = 0 THEN 1 ELSE 0 END WHERE id = ?',
    [id],
    function (err) {
      if (err) {
        return res.status(500).json({ message: '任务状态更新失败' });
      }

      res.json({ message: '状态更新成功' });
    }
  );
});

// 编辑任务
app.put('/todos/:id/text', (req, res) => {
  const id = Number(req.params.id);
  const { text } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ message: '任务内容不能为空' });
  }

  db.run(
    'UPDATE todos SET text = ? WHERE id = ?',
    [text.trim(), id],
    function (err) {
      if (err) {
        return res.status(500).json({ message: '任务修改失败' });
      }

      res.json({ message: '任务修改成功' });
    }
  );
});

app.listen(PORT, () => {
  console.log(`server running at http://localhost:${PORT}`);
});