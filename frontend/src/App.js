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
  // Default LIGHT — only dark if user explicitly chose dark before
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');
  const isMobile = useIsMobile();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  // Set light on first load if no preference saved
  useEffect(() => {
    if (!localStorage.getItem('theme')) {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, []);

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
      background: dark ? '#111827' : '#f3f4f6',
      padding: 20,
      transition: 'background 0.3s'
    }}>
      <div style={{
        background: dark ? '#1f2937' : '#ffffff',
        borderRadius: 20, padding: 36,
        width: '100%', maxWidth: 380,
        boxShadow: dark
          ? '0 4px 24px rgba(0,0,0,0.4)'
          : '0 4px 24px rgba(0,0,0,0.08)',
        textAlign: 'center',
        border: dark ? '1px solid #374151' : '1px solid #e5e7eb',
        transition: 'background 0.3s'
      }}>
        <img src="/bappu.png" alt="Hariom Store" style={{
          width: 80, height: 80, borderRadius: '50%', objectFit: 'cover',
          marginBottom: 16,
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)'
        }} />
        <h2 style={{
          fontSize: 22, fontWeight: 700,
          color: dark ? '#f9fafb' : '#111827',
          marginBottom: 4, letterSpacing: -0.4
        }}>Hariom Store</h2>
        <p style={{
          color: dark ? '#9ca3af' : '#6b7280',
          fontSize: 14, marginBottom: 28
        }}>Sign in to continue</p>

        <div style={{ position: 'relative', marginBottom: 12 }}>
          <input
            type={showPass ? 'text' : 'password'}
            placeholder="Enter password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            style={{
              paddingRight: 48, marginBottom: 0,
              background: dark ? '#111827' : '#f9fafb',
              border: `1.5px solid ${dark ? '#374151' : '#e5e7eb'}`,
              color: dark ? '#f9fafb' : '#111827',
              borderRadius: 10
            }}
            autoFocus
          />
          <button onClick={() => setShowPass(s => !s)} style={{
            position: 'absolute', right: 12, top: '50%',
            transform: 'translateY(-50%)', background: 'none',
            border: 'none', cursor: 'pointer', fontSize: 18,
            color: dark ? '#9ca3af' : '#6b7280'
          }}>
            {showPass ? '🙈' : '👁️'}
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <button
          onClick={handleLogin}
          style={{
            width: '100%', padding: 14, marginBottom: 14,
            borderRadius: 10, border: 'none', cursor: 'pointer',
            fontSize: 16, fontWeight: 700,
            background: dark ? '#4b5563' : '#1f2937',
            color: '#ffffff',
            transition: 'opacity 0.2s'
          }}
        >
          Sign In
        </button>

        {/* Dark/Light toggle on login screen */}
        <button onClick={() => setDark(d => !d)} style={{
          background: 'none', border: 'none',
          color: dark ? '#9ca3af' : '#6b7280',
          cursor: 'pointer', fontSize: 13, fontFamily: 'inherit'
        }}>
          {dark ? '☀️ Switch to Light' : '🌙 Switch to Dark'}
        </button>
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
          {/* Dark/Light toggle always visible in header */}
          <button className="icon-btn" onClick={() => setDark(d => !d)} title="Toggle theme">
            {dark ? '☀️' : '🌙'}
          </button>
          <button className="icon-btn" onClick={handleLogout} title="Sign out">🚪</button>
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
        {/* SIDEBAR — desktop only */}
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