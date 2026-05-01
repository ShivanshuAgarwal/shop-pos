import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';

export default function BillHistory() {
  const [bills, setBills] = useState([]);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [alert, setAlert] = useState(null);

  const showAlert = (msg, type = 'success') => {
    setAlert({ msg, type });
    setTimeout(() => setAlert(null), 3000);
  };

  const loadBills = () => {
    fetch('/api/bills').then(r => r.json()).then(setBills);
  };

  useEffect(() => { loadBills(); }, []);

  const openBill = async (id) => {
    const res = await fetch(`/api/bills/${id}`);
    const data = await res.json();
    setSelected(data);
  };

  const deleteBill = async (id) => {
    if (!window.confirm('Delete this bill?')) return;
    await fetch(`/api/bills/${id}`, { method: 'DELETE' });
    showAlert('Bill deleted!');
    setSelected(null);
    loadBills();
  };

  const deleteAllBills = async () => {
    if (!window.confirm('Delete ALL bills? This cannot be undone!')) return;
    await fetch('/api/bills/all', { method: 'DELETE' });
    showAlert('All bills deleted!');
    loadBills();
  };

  const downloadXLSX = async () => {
    try {
      const res = await fetch('/api/bills/export');
      const data = await res.json();

      // Sheet 1: Bills summary
      const billRows = data.bills.map(b => ({
        'Bill Number': b.bill_number,
        'Customer Name': b.customer_name,
        'Phone': b.customer_phone || '',
        'Payment Mode': b.payment_mode?.toUpperCase(),
        'Subtotal (Rs.)': b.total,
        'Discount (Rs.)': b.discount,
        'Final Total (Rs.)': b.final_total,
        'Date & Time': new Date(b.created_at).toLocaleString(),
      }));

      // Sheet 2: Bill items detail
      const itemRows = data.items.map(i => ({
        'Bill Number': data.bills.find(b => b.id === i.bill_id)?.bill_number || '',
        'Product Name': i.product_name,
        'Barcode': i.barcode || '',
        'Quantity': i.quantity,
        'Price (Rs.)': i.price,
        'Subtotal (Rs.)': i.subtotal,
      }));

      const wb = XLSX.utils.book_new();
      const ws1 = XLSX.utils.json_to_sheet(billRows);
      const ws2 = XLSX.utils.json_to_sheet(itemRows);
      XLSX.utils.book_append_sheet(wb, ws1, 'Bills Summary');
      XLSX.utils.book_append_sheet(wb, ws2, 'Bill Items');

      const date = new Date().toISOString().split('T')[0];
      XLSX.writeFile(wb, `HariomStore_Bills_${date}.xlsx`);
      showAlert('Downloaded successfully!');
    } catch (err) {
      showAlert('Download failed: ' + err.message, 'error');
    }
  };

  const filtered = bills.filter(b =>
    b.bill_number.includes(search) ||
    b.customer_name.toLowerCase().includes(search.toLowerCase()) ||
    (b.customer_phone && b.customer_phone.includes(search))
  );

  const cashTotal = bills.reduce((s, b) => b.payment_mode === 'cash' ? s + b.final_total : s, 0);
  const upiTotal = bills.reduce((s, b) => b.payment_mode === 'upi' ? s + b.final_total : s, 0);

  if (selected) return (
    <div>
      <div className="card" id="print-area">
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <img src="/bappu.png" alt="Hariom Store" style={{ height: 50, borderRadius: '50%', marginBottom: 4 }} />
          <h2 style={{ fontSize: 20 }}>Hariom Store</h2>
          <div style={{ fontSize: 12, color: '#718096' }}>{new Date(selected.created_at).toLocaleString()}</div>
          <div style={{ fontWeight: 700, marginTop: 4 }}>{selected.bill_number}</div>
        </div>
        <div style={{ fontSize: 13, marginBottom: 12 }}>
          <div><b>Customer:</b> {selected.customer_name}</div>
          {selected.customer_phone && <div><b>Phone:</b> {selected.customer_phone}</div>}
          <div><b>Payment:</b> {selected.payment_mode?.toUpperCase()}</div>
        </div>
        <table className="bill-table">
          <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
          <tbody>
            {selected.items.map((item, i) => (
              <tr key={i}>
                <td>{item.product_name}</td>
                <td>{item.quantity}</td>
                <td>Rs.{item.price.toFixed(2)}</td>
                <td>Rs.{item.subtotal.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop: 12, textAlign: 'right', fontSize: 14 }}>
          <div>Subtotal: Rs.{selected.total.toFixed(2)}</div>
          {selected.discount > 0 && <div style={{ color: '#e53e3e' }}>Discount: -Rs.{selected.discount.toFixed(2)}</div>}
          <div style={{ fontSize: 20, fontWeight: 700, color: '#2d6a4f' }}>Total: Rs.{selected.final_total.toFixed(2)}</div>
        </div>
        <div style={{ textAlign: 'center', marginTop: 12, fontSize: 12, color: '#718096' }}>Thank you! Visit again 🙏</div>
      </div>
      <div className="row no-print">
        <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => window.print()}>🖨️ Print</button>
        <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => deleteBill(selected.id)}>🗑️ Delete</button>
        <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setSelected(null)}>← Back</button>
      </div>
    </div>
  );

  return (
    <div>
      {alert && <div className={`alert alert-${alert.type}`}>{alert.msg}</div>}

      <div className="stats">
        <div className="stat-card">
          <div className="value" style={{ color: '#2d6a4f' }}>Rs.{cashTotal.toFixed(0)}</div>
          <div className="label">💵 Cash Collection</div>
        </div>
        <div className="stat-card">
          <div className="value" style={{ color: '#6b46c1' }}>Rs.{upiTotal.toFixed(0)}</div>
          <div className="label">📱 UPI Collection</div>
        </div>
      </div>

      <div className="card">
        <div className="row" style={{ alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
          <h2 style={{ margin: 0, flex: 1 }}>Bill History ({bills.length})</h2>
          <button className="btn btn-primary" style={{ fontSize: 12, padding: '6px 12px' }} onClick={downloadXLSX}>
            📥 Download XLSX
          </button>
          <button className="btn btn-danger" style={{ fontSize: 12, padding: '6px 12px' }} onClick={deleteAllBills}>
            🗑️ Delete All
          </button>
        </div>
        <input
          placeholder="Search by bill number, customer name or phone..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {filtered.length === 0 && <p style={{ color: '#718096', fontSize: 13 }}>No bills found.</p>}
        {filtered.map(b => (
          <div key={b.id} className="low-stock-item">
            <div style={{ cursor: 'pointer', flex: 1 }} onClick={() => openBill(b.id)}>
              <div style={{ fontWeight: 600 }}>{b.bill_number}</div>
              <div style={{ fontSize: 12, color: '#718096' }}>
                {b.customer_name} {b.customer_phone ? `• ${b.customer_phone}` : ''} • {new Date(b.created_at).toLocaleString()}
              </div>
              <span className={`badge ${b.payment_mode === 'upi' ? 'badge-yellow' : 'badge-green'}`} style={{ marginTop: 4 }}>
                {b.payment_mode === 'upi' ? '📱 UPI' : '💵 Cash'}
              </span>
            </div>
            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
              <div style={{ fontWeight: 700, color: '#2d6a4f', fontSize: 16 }}>Rs.{b.final_total.toFixed(2)}</div>
              <button className="btn btn-danger" style={{ padding: '3px 10px', fontSize: 11 }}
                onClick={() => deleteBill(b.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}