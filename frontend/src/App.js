import React, { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import Billing from './pages/Billing';
import Inventory from './pages/Inventory';
import BillHistory from './pages/BillHistory';
import './App.css';

const ADMIN_PASS = 'admin@hariom';
const USER_PASS = 'user@hariom';

export default function App() {
  const [page, setPage] = useState('billing');
  const [role, setRole] = useState(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  const handleLogin = () => {
    if (password === ADMIN_PASS) { setRole('admin'); setPage('dashboard'); }
    else if (password === USER_PASS) { setRole('user'); setPage('billing'); }
    else setError('Wrong password! Try again.');
  };

  const handleLogout = () => {
    setRole(null); setPassword(''); setError(''); setShowPass(false); setPage('billing');
  };

  if (!role) return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--bg)', padding: 20
    }}>
      <div className="fade-in" style={{
        background: 'var(--card)', borderRadius: 24, padding: 32,
        width: '100%', maxWidth: 360,
        boxShadow: '0 20px 60px rgba(124,58,237,0.15)', textAlign: 'center',
        border: '1px solid var(--border)'
      }}>
        <img src="/bappu.png" alt="Hariom Store" style={{
          width: 80, height: 80, borderRadius: '50%', objectFit: 'cover',
          marginBottom: 16, boxShadow: '0 8px 24px rgba(124,58,237,0.2)'
        }} />
        <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 4, letterSpacing: -0.4 }}>
          Hariom Store
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 28 }}>
          Sign in to continue
        </p>

        <div style={{ position: 'relative', marginBottom: 12 }}>
          <input
            type={showPass ? 'text' : 'password'}
            placeholder="Enter password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            style={{ paddingRight: 48, marginBottom: 0 }}
            autoFocus
          />
          <button onClick={() => setShowPass(s => !s)} style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer', fontSize: 18,
            color: 'var(--text-secondary)', padding: 4
          }}>
            {showPass ? '🙈' : '👁️'}
          </button>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: 12 }}>{error}</div>
        )}

        <button className="btn btn-primary btn-full" onClick={handleLogin}
          style={{ borderRadius: 12, padding: '14px', fontSize: 16 }}>
          Sign In
        </button>

        <button onClick={() => setDark(d => !d)} style={{
          marginTop: 16, background: 'none', border: 'none',
          color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13
        }}>
          {dark ? '☀️ Light mode' : '🌙 Dark mode'}
        </button>
      </div>
    </div>
  );

  const navItems = role === 'admin'
    ? [
        { id: 'dashboard', icon: '📊', label: 'Dashboard' },
        { id: 'billing', icon: '🧾', label: 'Bill' },
        { id: 'inventory', icon: '📦', label: 'Inventory' },
        { id: 'history', icon: '📋', label: 'History' },
      ]
    : [
        { id: 'billing', icon: '🧾', label: 'New Bill' },
      ];

  const renderPage = () => {
    if (page === 'dashboard') return <Dashboard />;
    if (page === 'billing') return <Billing />;
    if (page === 'inventory') return <Inventory />;
    if (page === 'history') return <BillHistory />;
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-logo">
          <img src="/bappu.png" alt="Hariom Store" />
          <span className="header-title">Hariom Store</span>
        </div>
        <div className="header-actions">
          <span className="role-badge">
            {role === 'admin' ? '👑 Admin' : '👤 Cashier'}
          </span>
          <button className="icon-btn" onClick={() => setDark(d => !d)} title="Toggle theme">
            {dark ? '☀️' : '🌙'}
          </button>
          <button className="icon-btn" onClick={handleLogout} title="Logout">
            🚪
          </button>
        </div>
      </header>

      <main className="main fade-in">
        {renderPage()}
      </main>

      <nav className="bottom-nav">
        {navItems.map(item => (
          <button
            key={item.id}
            className={`nav-item ${page === item.id ? 'active' : ''}`}
            onClick={() => setPage(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}