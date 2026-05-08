const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../database');
const { authenticate, requireProjectAccess } = require('../middleware/auth');

const router = express.Router({ mergeParams: true });

// GET /api/projects/:projectId/tasks
router.get('/', authenticate, requireProjectAccess, (req, res) => {
  const { status, priority } = req.query;
  let sql = `
    SELECT t.*, u.name as assignee_name, u2.name as created_by_name
    FROM tasks t
    LEFT JOIN users u ON t.assignee_id = u.id
    LEFT JOIN users u2 ON t.created_by = u2.id
    WHERE t.project_id = ?
  `;
  const params = [req.params.projectId];
  if (status) { sql += ' AND t.status = ?'; params.push(status); }
  if (priority) { sql += ' AND t.priority = ?'; params.push(priority); }
  sql += ' ORDER BY t.created_at DESC';
  const tasks = db.prepare(sql).all(...params);
  res.json({ tasks });
});

// POST /api/projects/:projectId/tasks
router.post('/', authenticate, requireProjectAccess, [
  body('title').trim().notEmpty().withMessage('Title required'),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('due_date').optional({ nullable: true })
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { title, description = '', priority = 'medium', assignee_id, due_date } = req.body;
  const result = db.prepare(`
    INSERT INTO tasks (title, description, priority, project_id, assignee_id, created_by, due_date)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(title, description, priority, req.params.projectId, assignee_id || null, req.user.id, due_date || null);

  const task = db.prepare(`
    SELECT t.*, u.name as assignee_name, u2.name as created_by_name
    FROM tasks t
    LEFT JOIN users u ON t.assignee_id = u.id
    LEFT JOIN users u2 ON t.created_by = u2.id
    WHERE t.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json({ task });
});

// PUT /api/projects/:projectId/tasks/:taskId
router.put('/:taskId', authenticate, requireProjectAccess, (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND project_id = ?').get(req.params.taskId, req.params.projectId);
  if (!task) return res.status(404).json({ error: 'Task not found.' });

  const { title, description, status, priority, assignee_id, due_date } = req.body;
  const fields = ['updated_at = CURRENT_TIMESTAMP'];
  const values = [];
  if (title !== undefined) { fields.push('title = ?'); values.push(title); }
  if (description !== undefined) { fields.push('description = ?'); values.push(description); }
  if (status !== undefined) { fields.push('status = ?'); values.push(status); }
  if (priority !== undefined) { fields.push('priority = ?'); values.push(priority); }
  if (assignee_id !== undefined) { fields.push('assignee_id = ?'); values.push(assignee_id || null); }
  if (due_date !== undefined) { fields.push('due_date = ?'); values.push(due_date || null); }

  values.push(req.params.taskId);
  db.prepare(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`).run(...values);

  const updated = db.prepare(`
    SELECT t.*, u.name as assignee_name, u2.name as created_by_name
    FROM tasks t
    LEFT JOIN users u ON t.assignee_id = u.id
    LEFT JOIN users u2 ON t.created_by = u2.id
    WHERE t.id = ?
  `).get(req.params.taskId);

  res.json({ task: updated });
});

// DELETE /api/projects/:projectId/tasks/:taskId
router.delete('/:taskId', authenticate, requireProjectAccess, (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND project_id = ?').get(req.params.taskId, req.params.projectId);
  if (!task) return res.status(404).json({ error: 'Task not found.' });

  const canDelete = req.user.role === 'admin' || req.projectRole === 'admin' || task.created_by === req.user.id;
  if (!canDelete) return res.status(403).json({ error: 'Cannot delete this task.' });

  db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.taskId);
  res.json({ message: 'Task deleted.' });
});

module.exports = router;
