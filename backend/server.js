const express = require('express');
const Database = require('better-sqlite3');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend/build')));

const db = new Database('shop.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    barcode TEXT UNIQUE,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    stock INTEGER DEFAULT 0,
    unit TEXT DEFAULT 'pcs',
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS bills (
    id TEXT PRIMARY KEY,
    bill_number TEXT UNIQUE,
    customer_name TEXT,
    customer_phone TEXT,
    total REAL NOT NULL,
    discount REAL DEFAULT 0,
    final_total REAL NOT NULL,
    payment_mode TEXT DEFAULT 'cash',
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS bill_items (
    id TEXT PRIMARY KEY,
    bill_id TEXT,
    product_id TEXT,
    product_name TEXT,
    barcode TEXT,
    quantity REAL NOT NULL,
    price REAL NOT NULL,
    subtotal REAL NOT NULL,
    FOREIGN KEY(bill_id) REFERENCES bills(id)
  );
`);

app.get('/api/products', (req, res) => {
  const products = db.prepare('SELECT * FROM products ORDER BY name').all();
  res.json(products);
});

app.get('/api/products/barcode/:barcode', (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE barcode = ?').get(req.params.barcode);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

app.post('/api/products', (req, res) => {
  const { barcode, name, price, stock, unit } = req.body;
  if (!name || !price) return res.status(400).json({ error: 'Name and price required' });
  const id = uuidv4();
  try {
    db.prepare('INSERT INTO products (id, barcode, name, price, stock, unit) VALUES (?, ?, ?, ?, ?, ?)')
      .run(id, barcode || null, name, price, stock || 0, unit || 'pcs');
    res.json({ id, barcode, name, price, stock, unit });
  } catch (e) {
    res.status(400).json({ error: 'Barcode already exists' });
  }
});

app.post('/api/products/bulk', (req, res) => {
  const { products } = req.body;
  if (!products || products.length === 0) return res.status(400).json({ error: 'No products' });
  const insert = db.prepare('INSERT OR IGNORE INTO products (id, barcode, name, price, stock, unit) VALUES (?, ?, ?, ?, ?, ?)');
  const insertMany = db.transaction((items) => {
    let added = 0, skipped = 0;
    for (const p of items) {
      const result = insert.run(uuidv4(), p.barcode || null, p.name, p.price, p.stock || 0, p.unit || 'pcs');
      result.changes > 0 ? added++ : skipped++;
    }
    return { added, skipped };
  });
  const result = insertMany(products);
  res.json(result);
});

app.put('/api/products/:id', (req, res) => {
  const { barcode, name, price, stock, unit } = req.body;
  db.prepare('UPDATE products SET barcode=?, name=?, price=?, stock=?, unit=? WHERE id=?')
    .run(barcode, name, price, stock, unit, req.params.id);
  res.json({ success: true });
});

app.delete('/api/products/all', (req, res) => {
  db.prepare('DELETE FROM products').run();
  res.json({ success: true });
});

app.delete('/api/products/:id', (req, res) => {
  db.prepare('DELETE FROM products WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

app.get('/api/bills', (req, res) => {
  const bills = db.prepare('SELECT * FROM bills ORDER BY created_at DESC').all();
  res.json(bills);
});

app.get('/api/bills/export', (req, res) => {
  const bills = db.prepare('SELECT * FROM bills ORDER BY created_at DESC').all();
  const items = db.prepare('SELECT * FROM bill_items').all();
  res.json({ bills, items });
});

app.get('/api/bills/:id', (req, res) => {
  const bill = db.prepare('SELECT * FROM bills WHERE id=?').get(req.params.id);
  if (!bill) return res.status(404).json({ error: 'Bill not found' });
  const items = db.prepare('SELECT * FROM bill_items WHERE bill_id=?').all(req.params.id);
  res.json({ ...bill, items });
});

app.post('/api/bills', (req, res) => {
  const { customer_name, customer_phone, items, discount, payment_mode } = req.body;
  if (!items || items.length === 0) return res.status(400).json({ error: 'No items in bill' });
  const id = uuidv4();
  const bill_number = 'BILL-' + Date.now();
  const total = items.reduce((sum, i) => sum + i.subtotal, 0);
  const disc = discount || 0;
  const final_total = total - disc;
  const createBill = db.transaction(() => {
    db.prepare(`INSERT INTO bills (id, bill_number, customer_name, customer_phone, total, discount, final_total, payment_mode) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(id, bill_number, customer_name || 'Walk-in', customer_phone || '', total, disc, final_total, payment_mode || 'cash');
    for (const item of items) {
      db.prepare(`INSERT INTO bill_items (id, bill_id, product_id, product_name, barcode, quantity, price, subtotal) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(uuidv4(), id, item.product_id, item.product_name, item.barcode, item.quantity, item.price, item.subtotal);
      db.prepare('UPDATE products SET stock = stock - ? WHERE id=?').run(item.quantity, item.product_id);
    }
  });
  createBill();
  res.json({ id, bill_number, total, discount: disc, final_total });
});

app.delete('/api/bills/all', (req, res) => {
  db.prepare('DELETE FROM bill_items').run();
  db.prepare('DELETE FROM bills').run();
  res.json({ success: true });
});

app.delete('/api/bills/:id', (req, res) => {
  db.prepare('DELETE FROM bill_items WHERE bill_id=?').run(req.params.id);
  db.prepare('DELETE FROM bills WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

app.get('/api/dashboard', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const todaySales = db.prepare(`SELECT COALESCE(SUM(final_total),0) as total, COUNT(*) as count FROM bills WHERE date(created_at)=?`).get(today);
  const todayCash = db.prepare(`SELECT COALESCE(SUM(final_total),0) as total FROM bills WHERE date(created_at)=? AND payment_mode='cash'`).get(today);
  const todayUpi = db.prepare(`SELECT COALESCE(SUM(final_total),0) as total FROM bills WHERE date(created_at)=? AND payment_mode='upi'`).get(today);
  const totalProducts = db.prepare('SELECT COUNT(*) as count FROM products').get();
  const lowStock = db.prepare('SELECT * FROM products WHERE stock <= 5 ORDER BY stock ASC').all();
  const recentBills = db.prepare('SELECT * FROM bills ORDER BY created_at DESC LIMIT 5').all();
  res.json({ todaySales, todayCash: todayCash.total, todayUpi: todayUpi.total, totalProducts, lowStock, recentBills });
});

app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✅ Shop POS Server running!`);
  console.log(`📱 Open on any phone: http://YOUR_PC_IP:${PORT}`);
  console.log(`💻 Local: http://localhost:${PORT}\n`);
});