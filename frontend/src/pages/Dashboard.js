import React, { useEffect, useState } from 'react';

export default function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/api/dashboard').then(r => r.json()).then(setData);
  }, []);

  if (!data) return <div className="card">Loading...</div>;

  return (
    <div>
      <div className="stats">
        <div className="stat-card">
          <div className="value">Rs.{data.todaySales.total.toFixed(0)}</div>
          <div className="label">Today's Total Sales</div>
        </div>
        <div className="stat-card">
          <div className="value">{data.todaySales.count}</div>
          <div className="label">Bills Today</div>
        </div>
        <div className="stat-card">
          <div className="value" style={{ color: '#2d6a4f' }}>Rs.{data.todayCash.toFixed(0)}</div>
          <div className="label">💵 Cash Today</div>
        </div>
        <div className="stat-card">
          <div className="value" style={{ color: '#6b46c1' }}>Rs.{data.todayUpi.toFixed(0)}</div>
          <div className="label">📱 UPI Today</div>
        </div>
        <div className="stat-card">
          <div className="value">{data.totalProducts.count}</div>
          <div className="label">Total Products</div>
        </div>
        <div className="stat-card">
          <div className="value" style={{ color: data.lowStock.length > 0 ? '#e53e3e' : '#2d6a4f' }}>
            {data.lowStock.length}
          </div>
          <div className="label">Low Stock Items</div>
        </div>
      </div>

      {data.lowStock.length > 0 && (
        <div className="card">
          <h2>Low Stock Alert</h2>
          {data.lowStock.map(p => (
            <div className="low-stock-item" key={p.id}>
              <span>{p.name}</span>
              <span className="badge badge-red">{p.stock} {p.unit} left</span>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <h2>Recent Bills</h2>
        {data.recentBills.length === 0 && <p style={{ color: '#718096', fontSize: 13 }}>No bills yet today.</p>}
        {data.recentBills.map(b => (
          <div className="low-stock-item" key={b.id}>
            <div>
              <div style={{ fontWeight: 600 }}>{b.bill_number}</div>
              <div style={{ fontSize: 11, color: '#718096' }}>
                {b.customer_name} - {new Date(b.created_at).toLocaleTimeString()}
              </div>
              <span className={`badge ${b.payment_mode === 'upi' ? 'badge-yellow' : 'badge-green'}`}>
                {b.payment_mode === 'upi' ? '📱 UPI' : '💵 Cash'}
              </span>
            </div>
            <span style={{ fontWeight: 700, color: '#2d6a4f' }}>Rs.{b.final_total.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}