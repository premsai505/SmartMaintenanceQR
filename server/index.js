import express from 'express';
import cors from 'cors';
import pg from 'pg';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Render binds a port to process.env.PORT
const port = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'smart-maintenance-super-secret-key-2024';

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

// Initialize PostgreSQL Pool using the connection string from .env
const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.connect()
  .then(() => {
    console.log('Connected to PostgreSQL Database');
    initSchema();
  })
  .catch(err => console.error('Database connection error:', err.stack));

async function initSchema() {
  try {
    // 1. Users Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE,
        password TEXT,
        role TEXT,
        phone TEXT
      )
    `);

    // 2. Routing Rules (Maps a hostel string to a staff user id)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS routing_rules (
        id TEXT PRIMARY KEY,
        hostel_name TEXT,
        staff_id TEXT
      )
    `);

    // 3. Tickets
    await pool.query(`
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 4. QR Locations
    await pool.query(`
      CREATE TABLE IF NOT EXISTS qr_locations (
        id TEXT PRIMARY KEY,
        hostel_name TEXT,
        floor_name TEXT,
        qr_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Seed Main Admin and demo Staff/Student
    const insertQuery = `INSERT INTO users (id, email, password, role) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING`;
    await pool.query(insertQuery, ['u-admin', 'admin@college.edu', 'admin123', 'admin']);
    await pool.query(insertQuery, ['u-staff1', 'staff@college.edu', 'staff123', 'staff']);
    await pool.query(insertQuery, ['u-student1', 'student@college.edu', 'student123', 'student']);
  } catch (err) {
    console.error('Error initializing schema:', err.message);
  }
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
app.post('/api/login', async (req, res) => {
  const email = req.body.email?.trim().toLowerCase();
  const password = req.body.password;
  try {
    const result = await pool.query(`SELECT * FROM users WHERE email = $1 AND password = $2`, [email, password]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid email id or password' });
    
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/signup', async (req, res) => {
  const email = req.body.email?.trim().toLowerCase();
  const { password, phone, role } = req.body;
  const newId = uuidv4();
  // Allow explicit role signup (student/staff/admin) for demo purposes. 
  // In a real app, admin/staff roles should only be minted by admins.
  const userRole = (role === 'admin' || role === 'staff') ? role : 'student';
  
  try {
    await pool.query(`INSERT INTO users (id, email, password, role, phone) VALUES ($1, $2, $3, $4, $5)`, 
      [newId, email, password, userRole, phone || null]);
    const token = jwt.sign({ id: newId, email, role: userRole }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: newId, email, role: userRole } });
  } catch (err) {
    return res.status(400).json({ error: 'Email already exists' });
  }
});

app.get('/api/me', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`SELECT id, email, role, phone FROM users WHERE id = $1`, [req.user.id]);
    const user = result.rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------- ADMIN ROUTES -------------
// Create any user (Admin making other Admins, Staff, or Students)
app.post('/api/admin/users', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const email = req.body.email?.trim().toLowerCase();
  const { password, role, phone } = req.body;
  const newId = uuidv4();
  
  try {
    await pool.query(`INSERT INTO users (id, email, password, role, phone) VALUES ($1, $2, $3, $4, $5)`, 
      [newId, email, password, role, phone || null]);
    res.json({ id: newId, email, role, phone });
  } catch (err) {
    res.status(400).json({ error: 'Email already exists' });
  }
});

// Get Staff list (for dropdowns)
app.get('/api/admin/staff', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`SELECT id, email, phone FROM users WHERE role = 'staff'`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create/Update routing rule
app.post('/api/admin/rules', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const { hostel_name, staff_id } = req.body;
  const newId = uuidv4();
  
  try {
    await pool.query(`DELETE FROM routing_rules WHERE hostel_name = $1`, [hostel_name]);
    await pool.query(`INSERT INTO routing_rules (id, hostel_name, staff_id) VALUES ($1, $2, $3)`, [newId, hostel_name, staff_id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/rules', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.id, r.hostel_name, r.staff_id, u.email as staff_email 
      FROM routing_rules r 
      LEFT JOIN users u ON r.staff_id = u.id
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Store QR Location
app.post('/api/admin/qrs', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const { hostel_name, floor_name, qr_url } = req.body;
  const newId = uuidv4();
  
  try {
    await pool.query(`INSERT INTO qr_locations (id, hostel_name, floor_name, qr_url) VALUES ($1, $2, $3, $4)`, 
      [newId, hostel_name, floor_name, qr_url]);
    res.json({ success: true, id: newId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/qrs', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  
  try {
    const result = await pool.query(`SELECT * FROM qr_locations ORDER BY created_at DESC`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Analytics
app.get('/api/admin/stats', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  
  try {
    const statusResult = await pool.query(`SELECT status, COUNT(*) as count FROM tickets GROUP BY status`);
    const monthResult = await pool.query(`SELECT COUNT(*) as total FROM tickets WHERE created_at >= NOW() - INTERVAL '30 days'`);
    
    res.json({ 
      tickets_by_status: statusResult.rows,
      tickets_last_30_days: monthResult.rows[0] ? parseInt(monthResult.rows[0].total) : 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------- TICKET ROUTES -------------
app.post('/api/tickets', authMiddleware, upload.single('image'), async (req, res) => {
  const { hostel_name, floor_name, student_phone, problem_type, description } = req.body;
  const image_url = req.file ? `/uploads/${req.file.filename}` : null;
  const id = uuidv4().substring(0, 8).toUpperCase(); 
  
  try {
    // Auto Allocation Magic based on the Hostel
    const ruleResult = await pool.query(`SELECT staff_id FROM routing_rules WHERE hostel_name = $1`, [hostel_name]);
    const allocated_to = ruleResult.rows.length > 0 ? ruleResult.rows[0].staff_id : null;
    
    const query = `
      INSERT INTO tickets (id, hostel_name, floor_name, student_email, student_phone, problem_type, description, image_url, status, allocated_to) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Pending', $9)
    `;
    await pool.query(query, [id, hostel_name, floor_name, req.user.email, student_phone, problem_type, description, image_url, allocated_to]);
    res.status(201).json({ id, allocated_to });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get tickets (Admins see all, Staff see allocated, Students see theirs)
app.get('/api/tickets', authMiddleware, async (req, res) => {
  let query = `SELECT * FROM tickets ORDER BY created_at DESC`;
  let params = [];
  
  if (req.user.role === 'staff') {
    query = `SELECT * FROM tickets WHERE allocated_to = $1 ORDER BY created_at DESC`;
    params = [req.user.id];
  } else if (req.user.role === 'student') {
    query = `SELECT * FROM tickets WHERE student_email = $1 ORDER BY created_at DESC`;
    params = [req.user.email];
  }
  
  try {
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Single Ticket
app.get('/api/tickets/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pool.query(`SELECT * FROM tickets WHERE id = $1`, [id]);
    const row = result.rows[0];
    if (!row) return res.status(404).json({ error: 'Ticket not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Staff updates status and optionally uploads a completion image
app.put('/api/tickets/:id/status', authMiddleware, upload.single('completion_image'), async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const completion_image_url = req.file ? `/uploads/${req.file.filename}` : null;
  
  // Only Staff or Admins should update status
  if (req.user.role === 'student') return res.status(403).json({ error: 'Forbidden' });
  
  try {
    if (completion_image_url) {
      await pool.query(`UPDATE tickets SET status = $1, completion_image_url = $2 WHERE id = $3`, 
        [status, completion_image_url, id]);
      res.json({ success: true, completion_image_url });
    } else {
      await pool.query(`UPDATE tickets SET status = $1 WHERE id = $2`, [status, id]);
      res.json({ success: true });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
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
