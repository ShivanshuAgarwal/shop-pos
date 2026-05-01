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
    setRole(null); setPassword(''); setError('');
    setShowPass(false); setPage('billing');
  };

  if (!role) return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--bg)', padding: 20
    }}>
      <div style={{
        background: 'var(--card)', borderRadius: 24, padding: 32,
        width: '100%', maxWidth: 360,
        boxShadow: '0 20px 60px rgba(124,58,237,0.15)',
        textAlign: 'center', border: '1px solid var(--border)',
        animation: 'fadeIn 0.4s ease'
      }}>
        <img src="/bappu.png" alt="Hariom Store" style={{
          width: 80, height: 80, borderRadius: '50%', objectFit: 'cover',
          marginBottom: 16, boxShadow: '0 8px 24px rgba(124,58,237,0.2)'
        }} />
        <h2 style={{
          fontSize: 22, fontWeight: 700, color: 'var(--text)',
          marginBottom: 4, letterSpacing: -0.4
        }}>Hariom Store</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
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
            position: 'absolute', right: 12, top: '50%',
            transform: 'translateY(-50%)', background: 'none',
            border: 'none', cursor: 'pointer', fontSize: 18,
            color: 'var(--text-secondary)'
          }}>
            {showPass ? '🙈' : '👁️'}
          </button>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <button className="btn btn-primary btn-full"
          onClick={handleLogin}
          style={{ borderRadius: 12, padding: 14, fontSize: 16, marginBottom: 12 }}>
          Sign In
        </button>
        <button onClick={() => setDark(d => !d)} style={{
          background: 'none', border: 'none',
          color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13
        }}>
          {dark ? '☀️ Light mode' : '🌙 Dark mode'}
        </button>
      </div>
    </div>
  );

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
          <h1>Hariom Store</h1>
        </div>
        <div className="header-actions">
          <span className="role-badge">
            {role === 'admin' ? '👑 Admin' : '👤 Cashier'}
          </span>
          <button className="icon-btn" onClick={() => setDark(d => !d)}>
            {dark ? '☀️' : '🌙'}
          </button>
          <button className="icon-btn" onClick={handleLogout}>🚪</button>
        </div>
      </header>

      <nav className="nav">
        {role === 'admin' && (
          <button className={`nav-btn ${page === 'dashboard' ? 'active' : ''}`}
            onClick={() => setPage('dashboard')}>📊 Dashboard</button>
        )}
        <button className={`nav-btn ${page === 'billing' ? 'active' : ''}`}
          onClick={() => setPage('billing')}>🧾 New Bill</button>
        {role === 'admin' && <>
          <button className={`nav-btn ${page === 'inventory' ? 'active' : ''}`}
            onClick={() => setPage('inventory')}>📦 Inventory</button>
          <button className={`nav-btn ${page === 'history' ? 'active' : ''}`}
            onClick={() => setPage('history')}>📋 Bills</button>
        </>}
      </nav>

      <main className="main">
        {renderPage()}
      </main>
    </div>
  );
}