import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'member' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) return setError('Password must be at least 6 characters.');
    setLoading(true); setError('');
    try {
      await signup(form.name, form.email, form.password, form.role);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Signup failed.');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="logo-mark">T</div>
          <span className="logo-text">TaskFlow</span>
        </div>
        <h2 className="auth-title">Create account</h2>
        <p className="auth-subtitle">Get started with your team workspace</p>

        {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="label">Full name</label>
            <input className="input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Arjun Sharma" required />
          </div>
          <div className="input-group">
            <label className="label">Email address</label>
            <input type="email" className="input" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@company.com" required />
          </div>
          <div className="input-group">
            <label className="label">Password</label>
            <input type="password" className="input" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Min. 6 characters" required />
          </div>
          <div className="input-group">
            <label className="label">Account type</label>
            <select className="select" value={form.role} onChange={e => set('role', e.target.value)}>
              <option value="member">Member — join projects and work on tasks</option>
              <option value="admin">Admin — create and manage projects</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px' }} disabled={loading}>
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
