import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export default function Billing() {
  const [items, setItems] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const [customer, setCustomer] = useState({ name: '', phone: '' });
  const [discount, setDiscount] = useState(0);
  const [paymentMode, setPaymentMode] = useState('cash');
  const [alert, setAlert] = useState(null);
  const [lastBill, setLastBill] = useState(null);
  const [products, setProducts] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const scannerRef = useRef(null);

  useEffect(() => {
    fetch('/api/products').then(r => r.json()).then(setProducts);
  }, []);

  const showAlert = (msg, type = 'info') => {
    setAlert({ msg, type });
    setTimeout(() => setAlert(null), 3000);
  };

  const fetchByBarcode = async (barcode) => {
    if (!barcode) return;
    try {
      const res = await fetch(`/api/products/barcode/${barcode}`);
      if (!res.ok) { showAlert('Product not found: ' + barcode, 'error'); return; }
      const product = await res.json();
      addItem(product);
    } catch { showAlert('Error fetching product', 'error'); }
  };

  const addItem = (product) => {
    setItems(prev => {
      const existing = prev.find(i => i.product_id === product.id);
      if (existing) {
        return prev.map(i => i.product_id === product.id
          ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.price }
          : i);
      }
      return [...prev, {
        product_id: product.id,
        product_name: product.name,
        barcode: product.barcode,
        price: product.price,
        quantity: 1,
        subtotal: product.price,
        unit: product.unit,
      }];
    });
    showAlert(product.name + ' added!', 'success');
    setProductSearch('');
    setShowDropdown(false);
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    (p.barcode && p.barcode.includes(productSearch))
  );

  const updateQty = (idx, qty) => {
    if (qty <= 0) { removeItem(idx); return; }
    setItems(prev => prev.map((item, i) =>
      i === idx ? { ...item, quantity: qty, subtotal: qty * item.price } : item
    ));
  };

  const removeItem = (idx) => setItems(prev => prev.filter((_, i) => i !== idx));

  const startScanner = async () => {
    setScanning(true);
    setTimeout(async () => {
      try {
        const html5QrCode = new Html5Qrcode('qr-reader');
        scannerRef.current = html5QrCode;
        await html5QrCode.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 150 } },
          (decodedText) => { stopScanner(); fetchByBarcode(decodedText); },
          () => {}
        );
      } catch (e) {
        showAlert('Camera error: ' + e, 'error');
        setScanning(false);
      }
    }, 100);
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); scannerRef.current.clear(); } catch (e) {}
      scannerRef.current = null;
    }
    setScanning(false);
  };

  useEffect(() => {
    return () => { if (scannerRef.current) scannerRef.current.stop().catch(() => {}); };
  }, []);

  const total = items.reduce((s, i) => s + i.subtotal, 0);
  const finalTotal = total - (parseFloat(discount) || 0);

  const saveBill = async () => {
    if (items.length === 0) { showAlert('Add items first!', 'error'); return; }
    try {
      const res = await fetch('/api/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: customer.name || 'Walk-in',
          customer_phone: customer.phone,
          items,
          discount: parseFloat(discount) || 0,
          payment_mode: paymentMode,
        }),
      });
      const bill = await res.json();
      setLastBill({ ...bill, items, customer_name: customer.name || 'Walk-in', customer_phone: customer.phone, payment_mode: paymentMode });
      setItems([]);
      setCustomer({ name: '', phone: '' });
      setDiscount(0);
      showAlert('Bill saved! ' + bill.bill_number, 'success');
    } catch { showAlert('Error saving bill', 'error'); }
  };

  if (lastBill) return (
    <div>
      <div className="card">
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <img src="/bappu.png" alt="Hariom Store" style={{ height: 50, borderRadius: '50%', marginBottom: 4 }} />
          <h2 style={{ fontSize: 20 }}>Hariom Store</h2>
          <div style={{ fontSize: 12, color: '#718096' }}>{new Date().toLocaleString()}</div>
          <div style={{ fontWeight: 700, marginTop: 4 }}>{lastBill.bill_number}</div>
        </div>
        <div style={{ fontSize: 13, marginBottom: 8 }}>
          <div><b>Customer:</b> {lastBill.customer_name}</div>
          {lastBill.customer_phone && <div><b>Phone:</b> {lastBill.customer_phone}</div>}
          <div><b>Payment:</b> {lastBill.payment_mode.toUpperCase()}</div>
        </div>
        <table className="bill-table">
          <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
          <tbody>
            {lastBill.items.map((item, i) => (
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
          <div>Subtotal: Rs.{lastBill.total.toFixed(2)}</div>
          {lastBill.discount > 0 && <div style={{ color: '#e53e3e' }}>Discount: -Rs.{lastBill.discount.toFixed(2)}</div>}
          <div style={{ fontSize: 20, fontWeight: 700, color: '#2d6a4f' }}>Total: Rs.{lastBill.final_total.toFixed(2)}</div>
        </div>
        <div style={{ textAlign: 'center', marginTop: 12, fontSize: 12, color: '#718096' }}>Thank you! Visit again 🙏</div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => window.print()}>Print Bill</button>
        <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setLastBill(null)}>New Bill</button>
      </div>
    </div>
  );

  return (
    <div>
      {alert && <div className={`alert alert-${alert.type}`}>{alert.msg}</div>}

      <div className="card">
        <h2>Scan Barcode</h2>
        {scanning ? (
          <div>
            <div id="qr-reader" style={{ width: '100%', borderRadius: 12, overflow: 'hidden' }}></div>
            <button className="btn btn-danger btn-full" style={{ marginTop: 8 }} onClick={stopScanner}>Stop Scanner</button>
          </div>
        ) : (
          <button className="btn btn-primary btn-full" onClick={startScanner}>Open Camera Scanner</button>
        )}
        <div style={{ margin: '10px 0', textAlign: 'center', color: '#718096', fontSize: 13 }}>or enter barcode manually</div>
        <div className="row">
          <input
            placeholder="Type barcode and press Enter"
            value={manualBarcode}
            onChange={e => setManualBarcode(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { fetchByBarcode(manualBarcode); setManualBarcode(''); } }}
          />
          <button className="btn btn-primary" onClick={() => { fetchByBarcode(manualBarcode); setManualBarcode(''); }}>Add</button>
        </div>
      </div>

      <div className="card">
        <h2>Search and Add Product</h2>
        <div style={{ position: 'relative' }}>
          <input
            placeholder="Type product name to search..."
            value={productSearch}
            onChange={e => { setProductSearch(e.target.value); setShowDropdown(true); }}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          />
          {showDropdown && productSearch.length > 0 && filteredProducts.length > 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0,
              background: 'white', border: '1.5px solid #e2e8f0',
              borderRadius: 8, zIndex: 100, maxHeight: 220, overflowY: 'auto',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}>
              {filteredProducts.map(p => (
                <div
                  key={p.id}
                  onMouseDown={() => addItem(p)}
                  style={{
                    padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f7fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = 'white'}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: '#718096' }}>{p.barcode || 'No barcode'} • Stock: {p.stock} {p.unit}</div>
                  </div>
                  <div style={{ fontWeight: 700, color: '#2d6a4f' }}>Rs.{p.price}</div>
                </div>
              ))}
            </div>
          )}
          {showDropdown && productSearch.length > 0 && filteredProducts.length === 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0,
              background: 'white', border: '1.5px solid #e2e8f0',
              borderRadius: 8, zIndex: 100, padding: '12px', color: '#718096', fontSize: 13
            }}>
              No products found
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h2>Bill Items</h2>
        {items.length === 0 && <p style={{ color: '#718096', fontSize: 13 }}>No items yet. Scan or search a product!</p>}
        {items.length > 0 && (
          <table className="bill-table">
            <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Sub</th><th></th></tr></thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i}>
                  <td>{item.product_name}</td>
                  <td>
                    <input type="number" value={item.quantity} min="1"
                      style={{ width: 50, marginBottom: 0, padding: '4px 6px' }}
                      onChange={e => updateQty(i, parseFloat(e.target.value))} />
                  </td>
                  <td>Rs.{item.price}</td>
                  <td>Rs.{item.subtotal.toFixed(2)}</td>
                  <td><button className="btn btn-danger" style={{ padding: '4px 8px', fontSize: 12 }} onClick={() => removeItem(i)}>X</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {items.length > 0 && (
        <div className="card">
          <h2>Customer and Payment</h2>
          <input placeholder="Customer Name (optional)" value={customer.name} onChange={e => setCustomer(c => ({ ...c, name: e.target.value }))} />
          <input placeholder="Phone (optional)" value={customer.phone} onChange={e => setCustomer(c => ({ ...c, phone: e.target.value }))} />
          <input type="number" placeholder="Discount (Rs.)" value={discount} onChange={e => setDiscount(e.target.value)} />
          <select value={paymentMode} onChange={e => setPaymentMode(e.target.value)}>
            <option value="cash">💵 Cash</option>
            <option value="upi">📱 UPI</option>
          </select>
          <div style={{ textAlign: 'right', marginBottom: 12, fontSize: 14 }}>
            <div>Subtotal: Rs.{total.toFixed(2)}</div>
            {discount > 0 && <div style={{ color: '#e53e3e' }}>Discount: -Rs.{parseFloat(discount).toFixed(2)}</div>}
            <div style={{ fontSize: 22, fontWeight: 700, color: '#2d6a4f' }}>Total: Rs.{finalTotal.toFixed(2)}</div>
          </div>
          <button className="btn btn-success btn-full" onClick={saveBill}>Save and Generate Bill</button>
        </div>
      )}
    </div>
  );
}