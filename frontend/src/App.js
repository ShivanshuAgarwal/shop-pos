import React, { useState } from 'react';
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

  const handleLogin = () => {
    if (password === ADMIN_PASS) {
      setRole('admin');
      setPage('dashboard');
    } else if (password === USER_PASS) {
      setRole('user');
      setPage('billing');
    } else {
      setError('Wrong password! Try again.');
    }
  };

  const handleLogout = () => {
    setRole(null);
    setPassword('');
    setError('');
    setPage('billing');
    setShowPass(false);
  };

  if (!role) return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#f0f4f8'
    }}>
      <div style={{
        background: 'white', borderRadius: 16, padding: 32,
        width: '90%', maxWidth: 360, boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
        textAlign: 'center'
      }}>
        <img src="/bappu.png" alt="Hariom Store" style={{
          height: 80, borderRadius: '50%', marginBottom: 12
        }} />
        <h2 style={{ color: '#2d6a4f', marginBottom: 4 }}>Hariom Store</h2>
        <p style={{ color: '#718096', fontSize: 13, marginBottom: 24 }}>Enter your password to continue</p>
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <input
            type={showPass ? 'text' : 'password'}
            placeholder="Enter password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            style={{
              width: '100%', padding: '12px 16px', borderRadius: 10,
              border: '1.5px solid #e2e8f0', fontSize: 16,
              boxSizing: 'border-box', paddingRight: 48
            }}
            autoFocus
          />
          <button
            onClick={() => setShowPass(s => !s)}
            style={{
              position: 'absolute', right: 12, top: '50%',
              transform: 'translateY(-50%)', background: 'none',
              border: 'none', cursor: 'pointer', fontSize: 18, color: '#718096'
            }}
          >
            {showPass ? '🙈' : '👁️'}
          </button>
        </div>
        {error && <div style={{
          color: '#e53e3e', fontSize: 13, marginBottom: 12
        }}>{error}</div>}
        <button
          onClick={handleLogin}
          style={{
            width: '100%', padding: '12px', borderRadius: 10,
            background: '#2d6a4f', color: 'white', border: 'none',
            fontSize: 16, fontWeight: 700, cursor: 'pointer'
          }}
        >
          Login
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
      <header className="header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/bappu.png" alt="Hariom Store" style={{ height: 40, borderRadius: '50%' }} />
          <h1 style={{ margin: 0 }}>Hariom Store</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>
            {role === 'admin' ? '👑 Admin' : '👤 Cashier'}
          </span>
          <button onClick={handleLogout} style={{
            background: 'rgba(255,255,255,0.2)', border: 'none',
            color: 'white', padding: '6px 12px', borderRadius: 8,
            cursor: 'pointer', fontSize: 12
          }}>Logout</button>
        </div>
      </header>

      <nav className="nav">
        {role === 'admin' && (
          <button className={`nav-btn ${page === 'dashboard' ? 'active' : ''}`} onClick={() => setPage('dashboard')}>🏠 Dashboard</button>
        )}
        <button className={`nav-btn ${page === 'billing' ? 'active' : ''}`} onClick={() => setPage('billing')}>🧾 New Bill</button>
        {role === 'admin' && (
          <>
            <button className={`nav-btn ${page === 'inventory' ? 'active' : ''}`} onClick={() => setPage('inventory')}>📦 Inventory</button>
            <button className={`nav-btn ${page === 'history' ? 'active' : ''}`} onClick={() => setPage('history')}>📋 Bills</button>
          </>
        )}
      </nav>

      <main className="main">
        {renderPage()}
      </main>
    </div>
  );
}