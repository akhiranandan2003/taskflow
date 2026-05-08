import { useState, useEffect } from 'react';
import { tasksAPI, authAPI } from '../api';

export default function TaskModal({ projectId, task, onClose, onSave }) {
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'todo',
    priority: task?.priority || 'medium',
    assignee_id: task?.assignee_id || '',
    due_date: task?.due_date || '',
  });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    authAPI.users().then(res => setUsers(res.data.users)).catch(() => {});
  }, []);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!form.title.trim()) return setError('Title is required');
    setLoading(true); setError('');
    try {
      const payload = { ...form, assignee_id: form.assignee_id || undefined };
      let saved;
      if (task) {
        saved = await tasksAPI.update(projectId, task.id, payload);
      } else {
        saved = await tasksAPI.create(projectId, payload);
      }
      onSave(saved.data.task);
      onClose();
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to save task');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3 className="modal-title">{task ? 'Edit Task' : 'New Task'}</h3>
          <button className="btn-ghost btn" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {error && <div className="alert alert-error">{error}</div>}
          <div className="input-group">
            <label className="label">Title *</label>
            <input className="input" value={form.title} onChange={e => set('title', e.target.value)} placeholder="Task title" />
          </div>
          <div className="input-group">
            <label className="label">Description</label>
            <textarea className="textarea" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Describe the task..." />
          </div>
          <div className="grid-2">
            <div className="input-group">
              <label className="label">Status</label>
              <select className="select" value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div className="input-group">
              <label className="label">Priority</label>
              <select className="select" value={form.priority} onChange={e => set('priority', e.target.value)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div className="grid-2">
            <div className="input-group">
              <label className="label">Assignee</label>
              <select className="select" value={form.assignee_id} onChange={e => set('assignee_id', e.target.value)}>
                <option value="">Unassigned</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label className="label">Due Date</label>
              <input type="date" className="input" value={form.due_date} onChange={e => set('due_date', e.target.value)} />
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving...' : (task ? 'Update' : 'Create')}
          </button>
        </div>
      </div>
    </div>
  );
}
