const express = require('express');
const multer = require('multer');
const fs = require('fs');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const app = express();
const PORT = 3000;
const SECRET = 'your_jwt_secret_key'; // store in .env for production

// PostgreSQL config
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'cozypaws',
  password: 'vanillacodemunazza',
  port: 5432,
});

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

// =======================
// AUTH ROUTES
// =======================

// Register User
app.post('/api/register', async (req, res) => {
  const { name, email, phone, password } = req.body;
  try {
    const existing = await pool.query('SELECT * FROM users WHERE email = $1', [
      email,
    ]);
    if (existing.rows.length > 0)
      return res.status(400).json({ message: 'User already exists' });

    const hashed = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (name, email, password, phone, is_admin, created_at)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
       RETURNING id, name, email`,
      [name, email, hashed, phone, false]
    );

    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login User
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [
      email,
    ]);
    const user = result.rows[0];
    if (!user)
      return res.status(401).json({ message: 'Invalid email or password' });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(401).json({ message: 'Invalid email or password' });

    const token = jwt.sign({ id: user.id, email: user.email }, SECRET, {
      expiresIn: '2h',
    });
    res.json({
      success: true,
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// =======================
// PET ROUTES
// =======================

// Upload Pet
app.post('/api/pets', upload.single('photo'), async (req, res) => {
  const { name, age, type, breed, gender, price, medical, description } = req.body;
  const status = parseInt(price) === 0 ? 'adoption' : 'sale';
  const image = `/uploads/${req.file.filename}`;

  try {
    const result = await pool.query(
      `INSERT INTO pets (name, age, type, breed, gender, price, status, medical, description, image)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        name,
        age,
        type.toLowerCase(),
        breed,
        gender,
        price,
        status,
        medical,
        description,
        image,
      ]
    );
    res.json({ success: true, message: 'Pet uploaded', pet: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to upload pet' });
  }
});

// Get Pets
app.get('/api/pets', async (req, res) => {
  const { status, type } = req.query;
  try {
    let query = 'SELECT * FROM pets';
    const conditions = [];
    const values = [];

    if (status) {
      conditions.push('status = $' + (values.length + 1));
      values.push(status.toLowerCase());
    }

    if (type) {
      conditions.push('type = $' + (values.length + 1));
      values.push(type.toLowerCase());
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch pets' });
  }
});

// Get Single Pet by ID
app.get('/api/pets/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('SELECT * FROM pets WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pet not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching pet:', err);
    res.status(500).json({ error: 'Failed to fetch pet' });
  }
});

// =======================

app.listen(PORT, () => {
  console.log(`Cozy Paws server running at http://localhost:${PORT}`);
});

// Adopt Pet (no payment)
app.post('/api/adopt/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Check if pet exists and is available for adoption
    const check = await pool.query('SELECT * FROM pets WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Pet not found' });
    }

    const pet = check.rows[0];
    if (pet.status !== 'adoption') {
      return res.status(400).json({ error: 'This pet is not available for adoption' });
    }

    // Update status to unavailable (adopted)
    await pool.query('UPDATE pets SET status = $1 WHERE id = $2', ['adopted', id]);

    res.json({ success: true, message: 'Pet successfully adopted!' });
  } catch (err) {
    console.error('Adoption error:', err);
    res.status(500).json({ success: false, message: 'Failed to adopt pet.' });
  }
});

// Buy Pet (after payment success)
app.post('/api/buy/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Check if pet exists and is available for sale
    const check = await pool.query('SELECT * FROM pets WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Pet not found' });
    }

    const pet = check.rows[0];
    if (pet.status !== 'sale') {
      return res.status(400).json({ error: 'This pet is not available for sale' });
    }

    // Update status to "unavailable"
    await pool.query('UPDATE pets SET status = $1 WHERE id = $2', ['unavailable', id]);

    res.json({ success: true, message: 'Pet successfully purchased!' });
  } catch (err) {
    console.error('Purchase error:', err);
    res.status(500).json({ success: false, message: 'Failed to purchase pet.' });
  }
});
