const express = require('express');
const multer = require('multer');
const fs = require('fs');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Multer config for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// Path to the JSON file
const PETS_DB = path.join(__dirname, 'data', 'pets.json');

// Ensure file exists
if (!fs.existsSync(PETS_DB)) fs.writeFileSync(PETS_DB, '[]');

// Helper to save pet to JSON DB
function savePet(pet) {
  const pets = JSON.parse(fs.readFileSync(PETS_DB));
  pets.push(pet);
  fs.writeFileSync(PETS_DB, JSON.stringify(pets, null, 2));
}

// Upload route
app.post('/api/pets', upload.single('photo'), (req, res) => {
  const { name, age, type, price, medical, description } = req.body;
  const status = parseInt(price) === 0 ? 'adoption' : 'sale';
  const imageUrl = `/uploads/${req.file.filename}`;

  const pet = {
    id: Date.now(),
    name,
    age,
    type,
    price,
    status: price == 0 ? 'adoption' : 'sale',
    medical: medical || '',
    description,
    imageUrl
  };

  savePet(pet);

  res.json({ success: true, message: 'Pet uploaded', pet });
});

// Fetch pets by type
app.get('/api/pets', (req, res) => {
  const { adopt, sell } = req.query;
  const pets = JSON.parse(fs.readFileSync(PETS_DB));

  let filtered = pets;
  if (adopt === 'true') filtered = pets.filter(p => p.status === 'adoption');
  if (sell === 'true') filtered = pets.filter(p => p.status === 'sale');

  res.json(filtered);
});

app.listen(PORT, () => {
  console.log(`🐾 Cozy Paws server running at http://localhost:${PORT}`);
});
