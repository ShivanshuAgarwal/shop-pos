import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ barcode: '', name: '', price: '', stock: '', unit: 'pcs' });
  const [editing, setEditing] = useState(null);
  const [alert, setAlert] = useState(null);
  const [search, setSearch] = useState('');
  const [preview, setPreview] = useState(null);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef();

  const showAlert = (msg, type = 'success') => {
    setAlert({ msg, type });
    setTimeout(() => setAlert(null), 4000);
  };

  const loadProducts = () => {
    fetch('/api/products').then(r => r.json()).then(setProducts);
  };

  useEffect(() => { loadProducts(); }, []);

  const handleSubmit = async () => {
    if (!form.name || !form.price) { showAlert('Name and price are required!', 'error'); return; }
    const method = editing ? 'PUT' : 'POST';
    const url = editing ? `/api/products/${editing}` : '/api/products';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, price: parseFloat(form.price), stock: parseInt(form.stock) || 0 }),
    });
    if (res.ok) {
      showAlert(editing ? 'Product updated!' : 'Product added!');
      setForm({ barcode: '', name: '', price: '', stock: '', unit: 'pcs' });
      setEditing(null);
      loadProducts();
    }
  };

  const handleEdit = (p) => {
    setEditing(p.id);
    setForm({ barcode: p.barcode || '', name: p.name, price: p.price, stock: p.stock, unit: p.unit });
    window.scrollTo(0, 0);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    await fetch(`/api/products/${id}`, { method: 'DELETE' });
    showAlert('Product deleted!');
    loadProducts();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const workbook = XLSX.read(evt.target.result, { type: 'binary' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        if (rows.length < 2) { showAlert('Excel file is empty!', 'error'); return; }

        // Show first row as headers for user to map
        const headers = rows[0].map((h, i) => ({ label: String(h || ''), index: i }));
        const sampleRows = rows.slice(1, 4);
        setPreview({ headers, rows: rows.slice(1), sampleRows, fileName: file.name });
      } catch (err) {
        showAlert('Error reading file: ' + err.message, 'error');
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const [colMap, setColMap] = useState({ name: '', price: '', barcode: '', stock: '' });

  const handleImport = async () => {
    if (!colMap.name || !colMap.price) { showAlert('Please map at least Name and Price columns!', 'error'); return; }
    
    setImporting(true);
    const products = preview.rows
      .filter(row => row[parseInt(colMap.name)])
      .map(row => ({
        name: String(row[parseInt(colMap.name)] || '').trim(),
        price: parseFloat(row[parseInt(colMap.price)]) || 0,
        barcode: colMap.barcode !== '' ? String(row[parseInt(colMap.barcode)] || '').replace(/[^0-9a-zA-Z\-]/g, '').trim() : null,
        stock: colMap.stock !== '' ? parseInt(row[parseInt(colMap.stock)]) || 0 : 0,
        unit: 'pcs',
      }))
      .filter(p => p.name && p.price > 0);

    try {
      const res = await fetch('/api/products/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products }),
      });
      const result = await res.json();
      showAlert(`Import done! ${result.added} added, ${result.skipped} skipped (duplicates).`, 'success');
      setPreview(null);
      setColMap({ name: '', price: '', barcode: '', stock: '' });
      loadProducts();
    } catch (err) {
      showAlert('Import failed: ' + err.message, 'error');
    }
    setImporting(false);
  };

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.barcode && p.barcode.includes(search))
  );

  return (
    <div>
      {alert && <div className={`alert alert-${alert.type}`}>{alert.msg}</div>}

      {/* Add / Edit Product */}
      <div className="card">
        <h2>{editing ? 'Edit Product' : 'Add Product'}</h2>
        <input placeholder="Barcode" value={form.barcode} onChange={e => setForm(f => ({ ...f, barcode: e.target.value }))} />
        <input placeholder="Product Name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        <div className="row">
          <input type="number" placeholder="Price (Rs.) *" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
          <input type="number" placeholder="Stock qty" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} />
        </div>
        <select value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}>
          <option value="pcs">Pieces (pcs)</option>
          <option value="kg">Kilogram (kg)</option>
          <option value="g">Gram (g)</option>
          <option value="l">Litre (l)</option>
          <option value="ml">Millilitre (ml)</option>
          <option value="pack">Pack</option>
          <option value="box">Box</option>
          <option value="dozen">Dozen</option>
        </select>
        <div className="row">
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSubmit}>
            {editing ? 'Update Product' : 'Add Product'}
          </button>
          {editing && (
            <button className="btn btn-secondary" onClick={() => { setEditing(null); setForm({ barcode: '', name: '', price: '', stock: '', unit: 'pcs' }); }}>
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Excel Import */}
      <div className="card">
        <h2>Import from Excel</h2>
        <p style={{ fontSize: 13, color: '#718096', marginBottom: 10 }}>
          Upload your Excel file (.xlsx) — your file has columns like Product Name, Price, Barcode Number. You'll map them below.
        </p>
        <input type="file" accept=".xlsx,.xls,.csv" ref={fileRef} onChange={handleFileUpload} style={{ display: 'none' }} />
        <button className="btn btn-primary btn-full" onClick={() => fileRef.current.click()}>
          📂 Choose Excel File
        </button>

        {/* Column Mapping */}
        {preview && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 14 }}>
              File: {preview.fileName} ({preview.rows.length} products found)
            </div>

            <div style={{ fontSize: 13, color: '#718096', marginBottom: 8 }}>Map your columns:</div>

            {/* Sample preview */}
            <div style={{ overflowX: 'auto', marginBottom: 12, fontSize: 12, border: '1px solid #e2e8f0', borderRadius: 8 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {preview.headers.map((h, i) => (
                      <th key={i} style={{ background: '#f7fafc', padding: '6px 10px', textAlign: 'left', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>
                        Col {i}: {h.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.sampleRows.map((row, i) => (
                    <tr key={i}>
                      {preview.headers.map((_, j) => (
                        <td key={j} style={{ padding: '5px 10px', borderBottom: '1px solid #f0f0f0', whiteSpace: 'nowrap', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {String(row[j] || '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#2d6a4f' }}>Product Name column *</label>
                <select value={colMap.name} onChange={e => setColMap(c => ({ ...c, name: e.target.value }))} style={{ marginTop: 4 }}>
                  <option value="">-- Select --</option>
                  {preview.headers.map((h, i) => <option key={i} value={i}>Col {i}: {h.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#2d6a4f' }}>Price column *</label>
                <select value={colMap.price} onChange={e => setColMap(c => ({ ...c, price: e.target.value }))} style={{ marginTop: 4 }}>
                  <option value="">-- Select --</option>
                  {preview.headers.map((h, i) => <option key={i} value={i}>Col {i}: {h.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#718096' }}>Barcode column (optional)</label>
                <select value={colMap.barcode} onChange={e => setColMap(c => ({ ...c, barcode: e.target.value }))} style={{ marginTop: 4 }}>
                  <option value="">-- None --</option>
                  {preview.headers.map((h, i) => <option key={i} value={i}>Col {i}: {h.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#718096' }}>Stock column (optional)</label>
                <select value={colMap.stock} onChange={e => setColMap(c => ({ ...c, stock: e.target.value }))} style={{ marginTop: 4 }}>
                  <option value="">-- None --</option>
                  {preview.headers.map((h, i) => <option key={i} value={i}>Col {i}: {h.label}</option>)}
                </select>
              </div>
            </div>

            <div className="row">
              <button className="btn btn-success" style={{ flex: 1 }} onClick={handleImport} disabled={importing}>
                {importing ? 'Importing...' : `Import ${preview.rows.length} Products`}
              </button>
              <button className="btn btn-secondary" onClick={() => { setPreview(null); setColMap({ name: '', price: '', barcode: '', stock: '' }); }}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Product List */}
      <div className="card">
        <div className="row" style={{ alignItems: 'center', marginBottom: 8 }}>
  <h2 style={{ margin: 0, flex: 1 }}>Products ({products.length})</h2>
  <button className="btn btn-danger" style={{ fontSize: 12, padding: '6px 12px' }} onClick={async () => {
    if (!window.confirm('Delete ALL products? This cannot be undone!')) return;
    await fetch('/api/products/all', { method: 'DELETE' });
    showAlert('All products deleted!');
    loadProducts();
  }}>🗑️ Delete All</button>
</div>
<input placeholder="Search by name or barcode..." value={search} onChange={e => setSearch(e.target.value)} />
        {filtered.length === 0 && <p style={{ color: '#718096', fontSize: 13 }}>No products found.</p>}
        <table className="bill-table">
          <thead>
            <tr><th>Name</th><th>Barcode</th><th>Price</th><th>Stock</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id}>
                <td><strong>{p.name}</strong></td>
                <td style={{ fontSize: 12, color: '#718096' }}>{p.barcode || '-'}</td>
                <td>Rs.{p.price}</td>
                <td>
                  <span className={`badge ${p.stock <= 0 ? 'badge-red' : p.stock <= 5 ? 'badge-yellow' : 'badge-green'}`}>
                    {p.stock} {p.unit}
                  </span>
                </td>
                <td>
                  <div className="row" style={{ gap: 4 }}>
                    <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => handleEdit(p)}>Edit</button>
                    <button className="btn btn-danger" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => handleDelete(p.id)}>Del</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}