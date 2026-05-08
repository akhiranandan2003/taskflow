import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectsAPI, tasksAPI, authAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import TaskModal from '../components/TaskModal';

const statusLabel = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };
const statusClass = { todo: 'badge-todo', in_progress: 'badge-in-progress', done: 'badge-done' };
const priorityClass = { high: 'badge-high', medium: 'badge-medium', low: 'badge-low' };
const COLS = ['todo', 'in_progress', 'done'];

export default function ProjectDetail() {
  const { id } = useParams();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('kanban');
  const [taskModal, setTaskModal] = useState(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [addMemberId, setAddMemberId] = useState('');
  const [addMemberRole, setAddMemberRole] = useState('member');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const isProjectAdmin = isAdmin || project?.owner_id === user?.id;

  const loadAll = async () => {
    try {
      const [proj, taskRes, userRes] = await Promise.all([
        projectsAPI.get(id),
        tasksAPI.list(id),
        authAPI.users()
      ]);
      setProject(proj.data.project);
      setMembers(proj.data.members);
      setTasks(taskRes.data.tasks);
      setAllUsers(userRes.data.users);
    } finally { setLoading(false); }
  };

  useEffect(() => { loadAll(); }, [id]);

  const handleTaskSave = (task) => {
    setTasks(prev => {
      const idx = prev.findIndex(t => t.id === task.id);
      if (idx >= 0) { const n = [...prev]; n[idx] = task; return n; }
      return [task, ...prev];
    });
  };

  const handleDeleteTask = async (task) => {
    if (!window.confirm(`Delete "${task.title}"?`)) return;
    await tasksAPI.delete(id, task.id);
    setTasks(prev => prev.filter(t => t.id !== task.id));
  };

  const handleAddMember = async () => {
    if (!addMemberId) return;
    await projectsAPI.addMember(id, { user_id: parseInt(addMemberId), role: addMemberRole });
    setShowAddMember(false); setAddMemberId('');
    loadAll();
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Remove this member?')) return;
    await projectsAPI.removeMember(id, userId);
    loadAll();
  };

  const filteredTasks = tasks.filter(t => {
    if (filterStatus && t.status !== filterStatus) return false;
    if (filterPriority && t.priority !== filterPriority) return false;
    return true;
  });

  const getProgress = () => {
    if (!tasks.length) return 0;
    return Math.round((tasks.filter(t => t.status === 'done').length / tasks.length) * 100);
  };

  if (loading) return <Layout><div className="loader"><div className="spinner" /> Loading project...</div></Layout>;
  if (!project) return <Layout><div className="page-body"><p>Project not found.</p></div></Layout>;

  const nonMembers = allUsers.filter(u => !members.find(m => m.id === u.id));

  return (
    <Layout>
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/projects')} style={{ padding: '4px 8px' }}>
              ← Back
            </button>
            <span className={`badge ${project.status === 'active' ? 'badge-in-progress' : 'badge-done'}`}>
              {project.status}
            </span>
          </div>
          <h1 className="page-title">{project.name}</h1>
          {project.description && <p className="page-subtitle">{project.description}</p>}
        </div>
        <button className="btn btn-primary" onClick={() => setTaskModal({})}>
          + New Task
        </button>
      </div>

      <div className="page-body">
        {/* Progress bar */}
        <div className="card" style={{ padding: '14px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 13, color: 'var(--text2)', whiteSpace: 'nowrap' }}>{tasks.length} tasks</span>
          <div style={{ flex: 1, height: 6, background: 'var(--bg3)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'var(--green)', width: `${getProgress()}%`, transition: 'width 0.3s', borderRadius: 3 }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>{getProgress()}% done</span>
          <span style={{ fontSize: 13, color: 'var(--text2)', whiteSpace: 'nowrap' }}>👥 {members.length} members</span>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
          {['kanban', 'list', 'members'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{
                padding: '8px 16px', fontSize: 14, fontWeight: 500,
                color: tab === t ? 'var(--accent2)' : 'var(--text2)',
                borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
                marginBottom: -1, transition: 'all 0.15s', textTransform: 'capitalize'
              }}
            >{t}</button>
          ))}
        </div>

        {/* Kanban */}
        {tab === 'kanban' && (
          <div className="kanban">
            {COLS.map(col => {
              const colTasks = filteredTasks.filter(t => t.status === col);
              return (
                <div key={col} className="kanban-col">
                  <div className="kanban-col-header">
                    <span className={`kanban-col-title ${col === 'done' ? 'text-green' : ''}`} style={{ color: col === 'done' ? 'var(--green)' : col === 'in_progress' ? 'var(--yellow)' : undefined }}>
                      {statusLabel[col]}
                    </span>
                    <span className="kanban-col-count">{colTasks.length}</span>
                  </div>
                  <div className="kanban-cards">
                    {colTasks.map(task => (
                      <div key={task.id} className="task-card">
                        <div className="task-card-title">{task.title}</div>
                        {task.description && <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8, lineHeight: 1.4 }}>{task.description.slice(0, 80)}{task.description.length > 80 ? '...' : ''}</p>}
                        <div className="task-card-meta">
                          <span className={`badge ${priorityClass[task.priority]}`}>{task.priority}</span>
                          {task.assignee_name && <span style={{ fontSize: 12, color: 'var(--text2)' }}>👤 {task.assignee_name}</span>}
                          {task.due_date && <span style={{ fontSize: 12, color: new Date(task.due_date) < new Date() ? 'var(--red)' : 'var(--text2)' }}>📅 {task.due_date}</span>}
                        </div>
                        <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                          <button className="btn btn-sm btn-secondary" onClick={() => setTaskModal(task)} style={{ fontSize: 12 }}>Edit</button>
                          {(isProjectAdmin || task.created_by === user?.id) && (
                            <button className="btn btn-sm btn-danger" onClick={() => handleDeleteTask(task)} style={{ fontSize: 12 }}>Delete</button>
                          )}
                        </div>
                      </div>
                    ))}
                    {colTasks.length === 0 && <div style={{ color: 'var(--text2)', fontSize: 13, padding: '8px 4px', textAlign: 'center' }}>No tasks</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* List view */}
        {tab === 'list' && (
          <>
            <div className="search-bar">
              <select className="select" style={{ width: 'auto' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="">All Status</option>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
              <select className="select" style={{ width: 'auto' }} value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
                <option value="">All Priority</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Task</th>
                      <th>Status</th>
                      <th>Priority</th>
                      <th>Assignee</th>
                      <th>Due Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTasks.length === 0 ? (
                      <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text2)', padding: 32 }}>No tasks found</td></tr>
                    ) : filteredTasks.map(task => (
                      <tr key={task.id}>
                        <td>
                          <div style={{ fontWeight: 500 }}>{task.title}</div>
                          {task.description && <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{task.description.slice(0, 60)}{task.description.length > 60 ? '...' : ''}</div>}
                        </td>
                        <td><span className={`badge ${statusClass[task.status]}`}>{statusLabel[task.status]}</span></td>
                        <td><span className={`badge ${priorityClass[task.priority]}`}>{task.priority}</span></td>
                        <td style={{ color: 'var(--text2)' }}>{task.assignee_name || '—'}</td>
                        <td style={{ color: task.due_date && new Date(task.due_date) < new Date() ? 'var(--red)' : 'var(--text2)', fontSize: 13 }}>
                          {task.due_date || '—'}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn btn-sm btn-secondary" onClick={() => setTaskModal(task)}>Edit</button>
                            {(isProjectAdmin || task.created_by === user?.id) && (
                              <button className="btn btn-sm btn-danger" onClick={() => handleDeleteTask(task)}>Del</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Members tab */}
        {tab === 'members' && (
          <div style={{ maxWidth: 600 }}>
            {isProjectAdmin && (
              <div style={{ marginBottom: 16, display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                <div className="input-group" style={{ flex: 1 }}>
                  <label className="label">Add Member</label>
                  <select className="select" value={addMemberId} onChange={e => setAddMemberId(e.target.value)}>
                    <option value="">Select user...</option>
                    {nonMembers.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                  </select>
                </div>
                <div className="input-group" style={{ width: 130 }}>
                  <label className="label">Role</label>
                  <select className="select" value={addMemberRole} onChange={e => setAddMemberRole(e.target.value)}>
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <button className="btn btn-primary" onClick={handleAddMember} disabled={!addMemberId}>Add</button>
              </div>
            )}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table>
                <thead><tr><th>Name</th><th>Email</th><th>Project Role</th>{isProjectAdmin && <th>Action</th>}</tr></thead>
                <tbody>
                  {members.map(m => (
                    <tr key={m.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className="avatar" style={{ width: 28, height: 28, fontSize: 11 }}>{m.name.split(' ').map(n => n[0]).join('').slice(0,2)}</div>
                          <span style={{ fontWeight: 500 }}>{m.name}</span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text2)', fontSize: 13 }}>{m.email}</td>
                      <td><span className={`badge ${m.project_role === 'admin' ? 'badge-admin' : 'badge-member'}`}>{m.project_role}</span></td>
                      {isProjectAdmin && (
                        <td>
                          {m.id !== user?.id && (
                            <button className="btn btn-sm btn-danger" onClick={() => handleRemoveMember(m.id)}>Remove</button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {taskModal !== null && (
        <TaskModal
          projectId={id}
          task={taskModal?.id ? taskModal : null}
          onClose={() => setTaskModal(null)}
          onSave={handleTaskSave}
        />
      )}
    </Layout>
  );
}
