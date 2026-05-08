import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

const priorityClass = { high: 'badge-high', medium: 'badge-medium', low: 'badge-low' };
const statusClass = { todo: 'badge-todo', in_progress: 'badge-in-progress', done: 'badge-done' };
const statusLabel = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };

function isOverdue(date) {
  if (!date) return false;
  return new Date(date) < new Date() && true;
}

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.get().then(res => setData(res.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout><div className="loader"><div className="spinner" /> Loading...</div></Layout>;

  const { stats, overdueTasks, recentTasks, myTasks } = data || {};

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Good to see you, {user?.name?.split(' ')[0]} 👋</p>
        </div>
      </div>

      <div className="page-body">
        {/* Stats */}
        <div className="grid-4" style={{ marginBottom: 24 }}>
          <div className="stat-card">
            <div className="stat-icon">📁</div>
            <div className="stat-value">{stats?.projects ?? 0}</div>
            <div className="stat-label">{isAdmin ? 'Total Projects' : 'My Projects'}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📋</div>
            <div className="stat-value">{stats?.tasks?.total ?? 0}</div>
            <div className="stat-label">Total Tasks</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⚡</div>
            <div className="stat-value">{stats?.tasks?.in_progress ?? 0}</div>
            <div className="stat-label">In Progress</div>
          </div>
          <div className="stat-card" style={{ borderColor: overdueTasks?.length > 0 ? 'rgba(239,68,68,0.4)' : undefined }}>
            <div className="stat-icon">🚨</div>
            <div className="stat-value" style={{ color: overdueTasks?.length > 0 ? 'var(--red)' : undefined }}>
              {stats?.overdue ?? 0}
            </div>
            <div className="stat-label">Overdue</div>
          </div>
        </div>

        <div className="grid-2" style={{ gap: 20 }}>
          {/* Recent Tasks */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 15, fontWeight: 600 }}>Recent Activity</h3>
            </div>
            {recentTasks?.length === 0 ? (
              <div className="empty-state" style={{ padding: '32px' }}>
                <div>No tasks yet</div>
              </div>
            ) : (
              <div style={{ padding: '8px 0' }}>
                {recentTasks?.slice(0, 6).map(task => (
                  <div
                    key={task.id}
                    onClick={() => navigate(`/projects/${task.project_id}`)}
                    style={{ padding: '10px 20px', cursor: 'pointer', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'background 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 3 }}>{task.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--text2)' }}>{task.project_name}</div>
                    </div>
                    <span className={`badge ${statusClass[task.status]}`}>{statusLabel[task.status]}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* My Tasks */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                <h3 style={{ fontSize: 15, fontWeight: 600 }}>Assigned to me</h3>
              </div>
              {myTasks?.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text2)', fontSize: 14 }}>No assigned tasks</div>
              ) : (
                <div style={{ padding: '8px 0' }}>
                  {myTasks?.map(task => (
                    <div key={task.id}
                      onClick={() => navigate(`/projects/${task.project_id}`)}
                      style={{ padding: '10px 20px', cursor: 'pointer', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 500 }}>{task.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--text2)' }}>{task.project_name}</div>
                      </div>
                      <span className={`badge ${priorityClass[task.priority]}`}>{task.priority}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Overdue */}
            {overdueTasks?.length > 0 && (
              <div className="card" style={{ padding: 0, overflow: 'hidden', borderColor: 'rgba(239,68,68,0.3)' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.05)' }}>
                  <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--red)' }}>🚨 Overdue Tasks</h3>
                </div>
                <div style={{ padding: '8px 0' }}>
                  {overdueTasks.map(task => (
                    <div key={task.id}
                      onClick={() => navigate(`/projects/${task.project_id}`)}
                      style={{ padding: '10px 20px', cursor: 'pointer', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 500 }}>{task.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--red)' }}>Due {task.due_date}</div>
                      </div>
                      <span className="badge badge-overdue">Overdue</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
