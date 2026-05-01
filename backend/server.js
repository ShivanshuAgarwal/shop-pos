const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'build')));

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// If no DATABASE_URL, use SQLite locally
let useLocal = false;
let localDb;
if (!process.env.DATABASE_URL) {
  useLocal = true;
  const Database = require('better-sqlite3');
  localDb = new Database('shop.db');
  localDb.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY, barcode TEXT UNIQUE, name TEXT NOT NULL,
      price REAL NOT NULL, stock INTEGER DEFAULT 0, unit TEXT DEFAULT 'pcs',
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS bills (
      id TEXT PRIMARY KEY, bill_number TEXT UNIQUE, customer_name TEXT,
      customer_phone TEXT, total REAL NOT NULL, discount REAL DEFAULT 0,
      final_total REAL NOT NULL, payment_mode TEXT DEFAULT 'cash',
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS bill_items (
      id TEXT PRIMARY KEY, bill_id TEXT, product_id TEXT, product_name TEXT,
      barcode TEXT, quantity REAL NOT NULL, price REAL NOT NULL, subtotal REAL NOT NULL,
      FOREIGN KEY(bill_id) REFERENCES bills(id)
    );
  `);
}

async function initPg() {
  if (useLocal) return;
  await db.query(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY, barcode TEXT UNIQUE, name TEXT NOT NULL,
      price REAL NOT NULL, stock INTEGER DEFAULT 0, unit TEXT DEFAULT 'pcs',
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS bills (
      id TEXT PRIMARY KEY, bill_number TEXT UNIQUE, customer_name TEXT,
      customer_phone TEXT, total REAL NOT NULL, discount REAL DEFAULT 0,
      final_total REAL NOT NULL, payment_mode TEXT DEFAULT 'cash',
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS bill_items (
      id TEXT PRIMARY KEY, bill_id TEXT, product_id TEXT, product_name TEXT,
      barcode TEXT, quantity REAL NOT NULL, price REAL NOT NULL, subtotal REAL NOT NULL
    );
  `);
}
initPg();

function q(sql, params=[]) {
  if (useLocal) {
    const s = sql
      .replace(/\$(\d+)/g, '?')
      .replace(/NOW\(\)/g, "datetime('now')")
      .replace(/ILIKE/g, 'LIKE');
    if (/^SELECT/i.test(sql)) return { rows: localDb.prepare(s).all(...params) };
    if (/RETURNING/i.test(sql)) return { rows: [localDb.prepare(s.replace(/RETURNING.*/i,'')).run(...params)] };
    localDb.prepare(s).run(...params);
    return { rows: [] };
  }
  return db.query(sql, params);
}

// PRODUCTS
app.get('/api/products', async (req, res) => {
  const r = await q('SELECT * FROM products ORDER BY name');
  res.json(r.rows);
});

app.get('/api/products/barcode/:barcode', async (req, res) => {
  const r = await q('SELECT * FROM products WHERE barcode = $1', [req.params.barcode]);
  if (!r.rows[0]) return res.status(404).json({ error: 'Product not found' });
  res.json(r.rows[0]);
});

app.post('/api/products', async (req, res) => {
  const { barcode, name, price, stock, unit } = req.body;
  if (!name || !price) return res.status(400).json({ error: 'Name and price required' });
  try {
    await q('INSERT INTO products (id,barcode,name,price,stock,unit) VALUES ($1,$2,$3,$4,$5,$6)',
      [uuidv4(), barcode||null, name, price, stock||0, unit||'pcs']);
    res.json({ success: true });
  } catch(e) { res.status(400).json({ error: 'Barcode already exists' }); }
});

app.post('/api/products/bulk', async (req, res) => {
  const { products } = req.body;
  if (!products?.length) return res.status(400).json({ error: 'No products' });
  let added=0, skipped=0;
  for (const p of products) {
    try {
      await q('INSERT INTO products (id,barcode,name,price,stock,unit) VALUES ($1,$2,$3,$4,$5,$6)',
        [uuidv4(), p.barcode||null, p.name, p.price, p.stock||0, p.unit||'pcs']);
      added++;
    } catch(e) { skipped++; }
  }
  res.json({ added, skipped });
});

app.put('/api/products/:id', async (req, res) => {
  const { barcode, name, price, stock, unit } = req.body;
  await q('UPDATE products SET barcode=$1,name=$2,price=$3,stock=$4,unit=$5 WHERE id=$6',
    [barcode, name, price, stock, unit, req.params.id]);
  res.json({ success: true });
});

app.delete('/api/products/all', async (req, res) => {
  await q('DELETE FROM products');
  res.json({ success: true });
});

app.delete('/api/products/:id', async (req, res) => {
  await q('DELETE FROM products WHERE id=$1', [req.params.id]);
  res.json({ success: true });
});

// BILLS
app.get('/api/bills', async (req, res) => {
  const r = await q('SELECT * FROM bills ORDER BY created_at DESC');
  res.json(r.rows);
});

app.get('/api/bills/export', async (req, res) => {
  const bills = await q('SELECT * FROM bills ORDER BY created_at DESC');
  const items = await q('SELECT * FROM bill_items');
  res.json({ bills: bills.rows, items: items.rows });
});

app.get('/api/bills/:id', async (req, res) => {
  const bill = await q('SELECT * FROM bills WHERE id=$1', [req.params.id]);
  if (!bill.rows[0]) return res.status(404).json({ error: 'Bill not found' });
  const items = await q('SELECT * FROM bill_items WHERE bill_id=$1', [req.params.id]);
  res.json({ ...bill.rows[0], items: items.rows });
});

app.post('/api/bills', async (req, res) => {
  const { customer_name, customer_phone, items, discount, payment_mode } = req.body;
  if (!items?.length) return res.status(400).json({ error: 'No items' });
  const id = uuidv4();
  const bill_number = 'BILL-' + Date.now();
  const total = items.reduce((s,i) => s+i.subtotal, 0);
  const disc = discount||0;
  const final_total = total - disc;
  await q('INSERT INTO bills (id,bill_number,customer_name,customer_phone,total,discount,final_total,payment_mode) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
    [id, bill_number, customer_name||'Walk-in', customer_phone||'', total, disc, final_total, payment_mode||'cash']);
  for (const item of items) {
    await q('INSERT INTO bill_items (id,bill_id,product_id,product_name,barcode,quantity,price,subtotal) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
      [uuidv4(), id, item.product_id, item.product_name, item.barcode, item.quantity, item.price, item.subtotal]);
    await q('UPDATE products SET stock=stock-$1 WHERE id=$2', [item.quantity, item.product_id]);
  }
  res.json({ id, bill_number, total, discount: disc, final_total });
});

app.delete('/api/bills/all', async (req, res) => {
  await q('DELETE FROM bill_items');
  await q('DELETE FROM bills');
  res.json({ success: true });
});

app.delete('/api/bills/:id', async (req, res) => {
  await q('DELETE FROM bill_items WHERE bill_id=$1', [req.params.id]);
  await q('DELETE FROM bills WHERE id=$1', [req.params.id]);
  res.json({ success: true });
});

// DASHBOARD
app.get('/api/dashboard', async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const sales = await q("SELECT COALESCE(SUM(final_total),0) as total, COUNT(*) as count FROM bills WHERE DATE(created_at)=$1", [today]);
  const cash = await q("SELECT COALESCE(SUM(final_total),0) as total FROM bills WHERE DATE(created_at)=$1 AND payment_mode='cash'", [today]);
  const upi = await q("SELECT COALESCE(SUM(final_total),0) as total FROM bills WHERE DATE(created_at)=$1 AND payment_mode='upi'", [today]);
  const prods = await q('SELECT COUNT(*) as count FROM products');
  const low = await q('SELECT * FROM products WHERE stock <= 5 ORDER BY stock ASC');
  const recent = await q('SELECT * FROM bills ORDER BY created_at DESC LIMIT 5');
  res.json({
    todaySales: { total: parseFloat(sales.rows[0].total), count: parseInt(sales.rows[0].count) },
    todayCash: parseFloat(cash.rows[0].total),
    todayUpi: parseFloat(upi.rows[0].total),
    totalProducts: { count: parseInt(prods.rows[0].count) },
    lowStock: low.rows,
    recentBills: recent.rows
  });
});

app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, 'build/index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✅ Shop POS Server running on port ${PORT}`);
  console.log(useLocal ? '💻 Using local SQLite' : '☁️ Using PostgreSQL');
});