import React, { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import Billing from './pages/Billing';
import Inventory from './pages/Inventory';
import BillHistory from './pages/BillHistory';
import './App.css';

const ADMIN_PASS = 'admin@hariom';
const USER_PASS = 'user@hariom';

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
};

export default function App() {
  const [page, setPage] = useState('billing');
  const [role, setRole] = useState(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');
  const isMobile = useIsMobile();

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
      justifyContent: 'center',
      background: isMobile ? 'var(--bg)' : '#f1f5f9',
      padding: 20
    }}>
      <div style={{
        background: 'white',
        borderRadius: 20, padding: 36,
        width: '100%', maxWidth: 380,
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        textAlign: 'center',
        border: '1px solid #e2e8f0',
      }}>
        <img src="/bappu.png" alt="Hariom Store" style={{
          width: 80, height: 80, borderRadius: '50%', objectFit: 'cover',
          marginBottom: 16,
          boxShadow: '0 4px 16px rgba(124,58,237,0.2)'
        }} />
        <h2 style={{
          fontSize: 22, fontWeight: 700, color: '#1e293b',
          marginBottom: 4, letterSpacing: -0.4
        }}>Hariom Store</h2>
        <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 28 }}>
          Sign in to continue
        </p>

        <div style={{ position: 'relative', marginBottom: 12 }}>
          <input
            type={showPass ? 'text' : 'password'}
            placeholder="Enter password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            style={{
              paddingRight: 48, marginBottom: 0,
              background: '#f8fafc', border: '1.5px solid #e2e8f0',
              color: '#1e293b', borderRadius: 10
            }}
            autoFocus
          />
          <button onClick={() => setShowPass(s => !s)} style={{
            position: 'absolute', right: 12, top: '50%',
            transform: 'translateY(-50%)', background: 'none',
            border: 'none', cursor: 'pointer', fontSize: 18, color: '#94a3b8'
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

        {isMobile && (
          <button onClick={() => setDark(d => !d)} style={{
            background: 'none', border: 'none',
            color: '#94a3b8', cursor: 'pointer', fontSize: 13
          }}>
            {dark ? '☀️ Light mode' : '🌙 Dark mode'}
          </button>
        )}
      </div>
    </div>
  );

  const adminNavItems = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard' },
    { id: 'billing', icon: '🧾', label: 'New Bill' },
    { id: 'inventory', icon: '📦', label: 'Inventory' },
    { id: 'history', icon: '📋', label: 'Bill History' },
  ];

  const userNavItems = [
    { id: 'billing', icon: '🧾', label: 'New Bill' },
  ];

  const navItems = role === 'admin' ? adminNavItems : userNavItems;

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
          {isMobile && (
            <button className="icon-btn" onClick={() => setDark(d => !d)}>
              {dark ? '☀️' : '🌙'}
            </button>
          )}
          <button className="icon-btn" onClick={handleLogout} title="Logout">🚪</button>
        </div>
      </header>

      {/* MOBILE NAV */}
      <nav className="nav">
        {navItems.map(item => (
          <button
            key={item.id}
            className={`nav-btn ${page === item.id ? 'active' : ''}`}
            onClick={() => setPage(item.id)}
          >
            {item.icon} {item.label}
          </button>
        ))}
      </nav>

      <div className="desktop-layout">
        {/* SIDEBAR - desktop only */}
        <aside className="sidebar">
          <div className="sidebar-label">Menu</div>
          {navItems.map(item => (
            <button
              key={item.id}
              className={`sidebar-btn ${page === item.id ? 'active' : ''}`}
              onClick={() => setPage(item.id)}
            >
              <span className="sidebar-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
          <div className="sidebar-logout">
            <button className="sidebar-btn" onClick={handleLogout}>
              <span className="sidebar-icon">🚪</span>
              Sign Out
            </button>
          </div>
        </aside>

        <main className="main">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}