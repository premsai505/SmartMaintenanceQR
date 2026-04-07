import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Render binds a port to process.env.PORT
const port = process.env.PORT || 3000;
const JWT_SECRET = 'smart-maintenance-super-secret-key-2024';

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
const dbDir = path.join(__dirname, 'db');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir);

// CREATE A FRESH DB SCHEMA
const db = new sqlite3.Database(path.join(dbDir, 'database4.sqlite'), (err) => {
  if (err) console.error('Error opening database', err.message);
  else initSchema();
});

function initSchema() {
  db.serialize(() => {
    // 1. Users Table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE,
        password TEXT,
        role TEXT,
        phone TEXT
      )
    `);

    // 2. Routing Rules (Maps a hostel string to a staff user id)
    db.run(`
      CREATE TABLE IF NOT EXISTS routing_rules (
        id TEXT PRIMARY KEY,
        hostel_name TEXT,
        staff_id TEXT
      )
    `);

    // 3. Tickets
    db.run(`
      CREATE TABLE IF NOT EXISTS tickets (
        id TEXT PRIMARY KEY,
        hostel_name TEXT,
        floor_name TEXT,
        student_email TEXT,
        student_phone TEXT,
        problem_type TEXT,
        description TEXT,
        image_url TEXT,
        completion_image_url TEXT,
        status TEXT,
        allocated_to TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 4. QR Locations
    db.run(`
      CREATE TABLE IF NOT EXISTS qr_locations (
        id TEXT PRIMARY KEY,
        hostel_name TEXT,
        floor_name TEXT,
        qr_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Seed Main Admin and demo Staff/Student
    const initCmd = db.prepare(`INSERT OR IGNORE INTO users (id, email, password, role) VALUES (?, ?, ?, ?)`);
    initCmd.run('u-admin', 'admin@college.edu', 'admin123', 'admin');
    initCmd.run('u-staff1', 'staff@college.edu', 'staff123', 'staff');
    initCmd.run('u-student1', 'student@college.edu', 'student123', 'student');
    initCmd.finalize();
  });
}

// Middleware to verify JWT
const authMiddleware = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Invalid token' });
    req.user = decoded;
    next();
  });
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// ------------- AUTH ROUTES -------------
app.post('/api/login', (req, res) => {
  const email = req.body.email?.trim().toLowerCase();
  const password = req.body.password;
  db.get(`SELECT * FROM users WHERE email = ? AND password = ?`, [email, password], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(401).json({ error: 'Invalid email id or password' });
    
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
  });
});

app.post('/api/signup', (req, res) => {
  const email = req.body.email?.trim().toLowerCase();
  const { password, phone, role } = req.body;
  const newId = uuidv4();
  // Allow explicit role signup (student/staff/admin) for demo purposes. 
  // In a real app, admin/staff roles should only be minted by admins.
  const userRole = (role === 'admin' || role === 'staff') ? role : 'student';
  
  db.run(`INSERT INTO users (id, email, password, role, phone) VALUES (?, ?, ?, ?, ?)`, 
    [newId, email, password, userRole, phone || null], 
    function(err) {
      if (err) return res.status(400).json({ error: 'Email already exists' });
      
      const token = jwt.sign({ id: newId, email, role: userRole }, JWT_SECRET, { expiresIn: '7d' });
      res.json({ token, user: { id: newId, email, role: userRole } });
  });
});

app.get('/api/me', authMiddleware, (req, res) => {
  db.get(`SELECT id, email, role, phone FROM users WHERE id = ?`, [req.user.id], (err, user) => {
    if (err || !user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  });
});

// ------------- ADMIN ROUTES -------------
// Create any user (Admin making other Admins, Staff, or Students)
app.post('/api/admin/users', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const email = req.body.email?.trim().toLowerCase();
  const { password, role, phone } = req.body;
  const newId = uuidv4();
  
  db.run(`INSERT INTO users (id, email, password, role, phone) VALUES (?, ?, ?, ?, ?)`, 
    [newId, email, password, role, phone || null], 
    function(err) {
      if (err) return res.status(400).json({ error: 'Email already exists' });
      res.json({ id: newId, email, role, phone });
  });
});

// Get Staff list (for dropdowns)
app.get('/api/admin/staff', authMiddleware, (req, res) => {
  db.all(`SELECT id, email, phone FROM users WHERE role = 'staff'`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Create/Update routing rule
app.post('/api/admin/rules', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const { hostel_name, staff_id } = req.body;
  const newId = uuidv4();
  
  db.run(`DELETE FROM routing_rules WHERE hostel_name = ?`, [hostel_name], (err) => {
    db.run(`INSERT INTO routing_rules (id, hostel_name, staff_id) VALUES (?, ?, ?)`, [newId, hostel_name, staff_id], (err) => {
      res.json({ success: true });
    });
  });
});

app.get('/api/admin/rules', authMiddleware, (req, res) => {
  db.all(`
    SELECT r.id, r.hostel_name, r.staff_id, u.email as staff_email 
    FROM routing_rules r 
    LEFT JOIN users u ON r.staff_id = u.id
  `, [], (err, rows) => {
    res.json(rows);
  });
});

// Store QR Location
app.post('/api/admin/qrs', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const { hostel_name, floor_name, qr_url } = req.body;
  const newId = uuidv4();
  db.run(`INSERT INTO qr_locations (id, hostel_name, floor_name, qr_url) VALUES (?, ?, ?, ?)`, [newId, hostel_name, floor_name, qr_url], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, id: newId });
  });
});

app.get('/api/admin/qrs', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  db.all(`SELECT * FROM qr_locations ORDER BY created_at DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Analytics
app.get('/api/admin/stats', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  
  // Calculate simple statistics for demonstration
  db.all(`SELECT status, COUNT(*) as count FROM tickets GROUP BY status`, [], (err, statusRows) => {
    db.get(`SELECT COUNT(*) as total FROM tickets WHERE created_at >= datetime('now', '-30 days')`, [], (err, monthRow) => {
      res.json({ 
        tickets_by_status: statusRows,
        tickets_last_30_days: monthRow ? monthRow.total : 0
      });
    });
  });
});

// ------------- TICKET ROUTES -------------
app.post('/api/tickets', authMiddleware, upload.single('image'), (req, res) => {
  const { hostel_name, floor_name, student_phone, problem_type, description } = req.body;
  const image_url = req.file ? `/uploads/${req.file.filename}` : null;
  const id = uuidv4().substring(0, 8).toUpperCase(); 
  
  // Auto Allocation Magic based on the Hostel
  db.get(`SELECT staff_id FROM routing_rules WHERE hostel_name = ?`, [hostel_name], (err, row) => {
    // If a rule exists for this hostel, assign it. Else, leave it null for an admin to handle.
    const allocated_to = row ? row.staff_id : null;
    
    const query = `
      INSERT INTO tickets (id, hostel_name, floor_name, student_email, student_phone, problem_type, description, image_url, status, allocated_to) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?)
    `;
    db.run(query, [id, hostel_name, floor_name, req.user.email, student_phone, problem_type, description, image_url, allocated_to], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id, allocated_to });
    });
  });
});

// Get tickets (Admins see all, Staff see allocated, Students see theirs)
app.get('/api/tickets', authMiddleware, (req, res) => {
  let query = `SELECT * FROM tickets ORDER BY created_at DESC`;
  let params = [];
  
  if (req.user.role === 'staff') {
    query = `SELECT * FROM tickets WHERE allocated_to = ? ORDER BY created_at DESC`;
    params = [req.user.id];
  } else if (req.user.role === 'student') {
    query = `SELECT * FROM tickets WHERE student_email = ? ORDER BY created_at DESC`;
    params = [req.user.email];
  }
  
  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Get Single Ticket
app.get('/api/tickets/:id', (req, res) => {
  const { id } = req.params;
  
  db.get(`SELECT * FROM tickets WHERE id = ?`, [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Ticket not found' });
    res.json(row);
  });
});

// Staff updates status and optionally uploads a completion image
app.put('/api/tickets/:id/status', authMiddleware, upload.single('completion_image'), (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const completion_image_url = req.file ? `/uploads/${req.file.filename}` : null;
  
  // Only Staff or Admins should update status
  if (req.user.role === 'student') return res.status(403).json({ error: 'Forbidden' });
  
  if (completion_image_url) {
    db.run(`UPDATE tickets SET status = ?, completion_image_url = ? WHERE id = ?`, [status, completion_image_url, id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, completion_image_url });
    });
  } else {
    db.run(`UPDATE tickets SET status = ? WHERE id = ?`, [status, id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    });
  }
});

// ------------- SERVE FRONTEND -------------
const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  
  app.get(/.*/, (req, res) => {
    // Avoid sending index.html for undefined API routes
    if (req.originalUrl.startsWith('/api/') || req.originalUrl.startsWith('/uploads/')) {
        return res.status(404).json({ error: 'Endpoint not found' });
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(port, () => console.log(`Server is running on port ${port}`));
