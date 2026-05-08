const express = require('express');
const db = require('../database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, (req, res) => {
  const userId = req.user.id;
  const isAdmin = req.user.role === 'admin';

  let projectCount, taskStats, overdueTasks, recentTasks, myTasks;

  if (isAdmin) {
    projectCount = (db.prepare('SELECT COUNT(*) as c FROM projects').get() || {}).c || 0;
    taskStats = db.prepare(`
      SELECT COUNT(*) as total,
        SUM(CASE WHEN status='todo' THEN 1 ELSE 0 END) as todo,
        SUM(CASE WHEN status='in_progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status='done' THEN 1 ELSE 0 END) as done
      FROM tasks
    `).get() || {};

    overdueTasks = db.prepare(`
      SELECT t.*, p.name as project_name, u.name as assignee_name
      FROM tasks t JOIN projects p ON t.project_id = p.id
      LEFT JOIN users u ON t.assignee_id = u.id
      WHERE t.due_date < date('now') AND t.status != 'done'
      ORDER BY t.due_date ASC LIMIT 10
    `).all();

    recentTasks = db.prepare(`
      SELECT t.*, p.name as project_name, u.name as assignee_name
      FROM tasks t JOIN projects p ON t.project_id = p.id
      LEFT JOIN users u ON t.assignee_id = u.id
      ORDER BY t.updated_at DESC LIMIT 8
    `).all();

    myTasks = db.prepare(`
      SELECT t.*, p.name as project_name FROM tasks t
      JOIN projects p ON t.project_id = p.id
      WHERE t.assignee_id = ? ORDER BY t.due_date ASC LIMIT 5
    `).all(userId);
  } else {
    projectCount = (db.prepare('SELECT COUNT(*) as c FROM project_members WHERE user_id = ?').get(userId) || {}).c || 0;

    taskStats = db.prepare(`
      SELECT COUNT(*) as total,
        SUM(CASE WHEN t.status='todo' THEN 1 ELSE 0 END) as todo,
        SUM(CASE WHEN t.status='in_progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN t.status='done' THEN 1 ELSE 0 END) as done
      FROM tasks t
      JOIN project_members pm ON pm.project_id = t.project_id AND pm.user_id = ?
    `).get(userId) || {};

    overdueTasks = db.prepare(`
      SELECT t.*, p.name as project_name, u.name as assignee_name
      FROM tasks t JOIN projects p ON t.project_id = p.id
      JOIN project_members pm ON pm.project_id = t.project_id AND pm.user_id = ?
      LEFT JOIN users u ON t.assignee_id = u.id
      WHERE t.due_date < date('now') AND t.status != 'done'
      ORDER BY t.due_date ASC LIMIT 10
    `).all(userId);

    recentTasks = db.prepare(`
      SELECT t.*, p.name as project_name, u.name as assignee_name
      FROM tasks t JOIN projects p ON t.project_id = p.id
      JOIN project_members pm ON pm.project_id = t.project_id AND pm.user_id = ?
      LEFT JOIN users u ON t.assignee_id = u.id
      ORDER BY t.updated_at DESC LIMIT 8
    `).all(userId);

    myTasks = db.prepare(`
      SELECT t.*, p.name as project_name FROM tasks t
      JOIN projects p ON t.project_id = p.id
      WHERE t.assignee_id = ? ORDER BY t.due_date ASC LIMIT 5
    `).all(userId);
  }

  res.json({
    stats: {
      projects: projectCount,
      tasks: taskStats,
      overdue: overdueTasks.length
    },
    overdueTasks,
    recentTasks,
    myTasks
  });
});

module.exports = router;
