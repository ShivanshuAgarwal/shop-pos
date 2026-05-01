import React, { useState } from 'react';
import Dashboard from './pages/Dashboard';
import Billing from './pages/Billing';
import Inventory from './pages/Inventory';
import BillHistory from './pages/BillHistory';
import './App.css';

export default function App() {
  const [page, setPage] = useState('dashboard');

  const renderPage = () => {
    if (page === 'dashboard') return <Dashboard />;
    if (page === 'billing') return <Billing />;
    if (page === 'inventory') return <Inventory />;
    if (page === 'history') return <BillHistory />;
  };

  return (
    <div className="app">
      <header className="header">
        <img src="/bappu.png" alt="Hariom Store" style={{height: 40, marginRight: 10, verticalAlign: 'middle', borderRadius: '50%'}} />
        <h1 style={{display: 'inline'}}>Hariom Store</h1>
     </header>
      <nav className="nav">
        <button className={`nav-btn ${page === 'dashboard' ? 'active' : ''}`} onClick={() => setPage('dashboard')}>🏠 Dashboard</button>
        <button className={`nav-btn ${page === 'billing' ? 'active' : ''}`} onClick={() => setPage('billing')}>🧾 New Bill</button>
        <button className={`nav-btn ${page === 'inventory' ? 'active' : ''}`} onClick={() => setPage('inventory')}>📦 Inventory</button>
        <button className={`nav-btn ${page === 'history' ? 'active' : ''}`} onClick={() => setPage('history')}>📋 Bills</button>
      </nav>
      <main className="main">
        {renderPage()}
      </main>
    </div>
  );
}