const jwt = require('jsonwebtoken');
const db = require('../database');

const JWT_SECRET = process.env.JWT_SECRET || 'taskflow_dev_secret_change_in_prod';

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided.' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(decoded.id);
    if (!user) return res.status(401).json({ error: 'User not found.' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

function requireProjectAccess(req, res, next) {
  const projectId = req.params.projectId || req.params.id;
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
  if (!project) return res.status(404).json({ error: 'Project not found.' });

  if (req.user.role === 'admin') {
    req.project = project;
    req.projectRole = 'admin';
    return next();
  }

  const membership = db.prepare(
    'SELECT role FROM project_members WHERE project_id = ? AND user_id = ?'
  ).get(projectId, req.user.id);

  if (!membership) return res.status(403).json({ error: 'Access denied to this project.' });

  req.project = project;
  req.projectRole = membership.role;
  next();
}

function requireProjectAdmin(req, res, next) {
  const projectId = req.params.projectId || req.params.id;
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
  if (!project) return res.status(404).json({ error: 'Project not found.' });

  if (req.user.role === 'admin' || project.owner_id === req.user.id) {
    req.project = project;
    return next();
  }
  return res.status(403).json({ error: 'Only project owners or admins can do this.' });
}

module.exports = { authenticate, requireProjectAccess, requireProjectAdmin, JWT_SECRET };
