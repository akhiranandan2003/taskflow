import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectsAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

const statusColors = { active: 'badge-in-progress', completed: 'badge-done', archived: 'badge-todo' };

export default function Projects() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const load = () => projectsAPI.list().then(r => setProjects(r.data.projects)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!form.name.trim()) return setError('Project name is required');
    setCreating(true); setError('');
    try {
      await projectsAPI.create(form);
      setForm({ name: '', description: '' });
      setShowCreate(false);
      load();
    } catch (e) { setError(e.response?.data?.error || 'Failed to create project'); }
    finally { setCreating(false); }
  };

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">{projects.length} project{projects.length !== 1 ? 's' : ''} accessible</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New Project
          </button>
        )}
      </div>

      <div className="page-body">
        {loading ? (
          <div className="loader"><div className="spinner" /> Loading projects...</div>
        ) : projects.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📁</div>
            <h3>No projects yet</h3>
            <p>{isAdmin ? 'Create your first project to get started.' : 'You haven\'t been added to any projects yet.'}</p>
          </div>
        ) : (
          <div className="grid-3">
            {projects.map(p => (
              <div key={p.id} className="card" onClick={() => navigate(`/projects/${p.id}`)}
                style={{ cursor: 'pointer', padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <span className={`badge ${statusColors[p.status] || 'badge-todo'}`}>{p.status}</span>
                  <span style={{ fontSize: 12, color: 'var(--text2)' }}>{new Date(p.created_at).toLocaleDateString()}</span>
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{p.name}</h3>
                <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16, lineHeight: 1.5 }}>
                  {p.description || 'No description provided'}
                </p>
                <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--text2)' }}>
                  <span>📋 {p.task_count} tasks</span>
                  <span>👥 {p.member_count} members</span>
                </div>
                <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text2)' }}>by {p.owner_name}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowCreate(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Create Project</h3>
              <button className="btn btn-ghost" onClick={() => setShowCreate(false)}>✕</button>
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-error">{error}</div>}
              <div className="input-group">
                <label className="label">Project Name *</label>
                <input className="input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Mobile App Redesign" />
              </div>
              <div className="input-group">
                <label className="label">Description</label>
                <textarea className="textarea" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="What's this project about?" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={creating}>{creating ? 'Creating...' : 'Create Project'}</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
