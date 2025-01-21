const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const cors = require('cors');
const User = require('./models/User'); // Mengimpor model User dari file eksternal

dotenv.config(); // Menggunakan variabel environment dari .env

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware CORS untuk menerima permintaan dari frontend
app.use(
  cors({
    origin: '*', // Membuka akses untuk semua domain (pastikan ini sesuai dengan kebutuhan Anda)
  })
);

// Parsing body JSON
app.use(express.json());

// Koneksi ke MongoDB
mongoose
  .connect(process.env.MONGO_URI)  // Hilangkan useNewUrlParser dan useUnifiedTopology
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1); // Keluar jika koneksi gagal
  });

// Middleware untuk validasi input
const validateInput = (req, res, next) => {
  const { email, password } = req.body;

  // Validasi input kosong
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  // Validasi email tidak boleh null atau kosong
  if (email === null || email === undefined || email.trim() === '') {
    return res.status(400).json({ message: 'Email cannot be null or empty' });
  }

  // Validasi format email yang lebih sederhana
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Sederhana dan cukup umum
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  // Validasi panjang password (misalnya minimal 6 karakter)
  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long' });
  }

  next();
};

// Endpoint untuk login
app.post('/login', validateInput, async (req, res) => {
  const { email, password } = req.body;

  try {
    // Cari pengguna berdasarkan email
    const user = await User.findOne({ email });

    if (!user) {
      console.log(`User with email ${email} not found`);
      return res.status(400).json({ message: 'Email not registered' });
    }

    // Bandingkan password yang dimasukkan dengan password yang tersimpan
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      console.log('Invalid password attempt for email:', email);
      return res.status(400).json({ message: 'Invalid password' });
    }

    // Jika berhasil login
    res.status(200).json({ message: 'Login successful', user });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Endpoint untuk registrasi
app.post('/register', validateInput, async (req, res) => {
  const { email, password } = req.body;

  // Periksa jika email atau password null
  if (!email || email.trim() === '') {
    return res.status(400).json({ message: 'Email cannot be null or empty' });
  }

  try {
    // Cek apakah email sudah terdaftar
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password sebelum menyimpan ke database
    const hashedPassword = await bcrypt.hash(password, 12); // Gunakan lebih banyak rounds untuk meningkatkan keamanan

    // Simpan pengguna baru ke database
    const newUser = new User({
      email,
      password: hashedPassword,
    });

    await newUser.save();

    res.status(201).json({ message: 'Registration successful' });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Menjalankan server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
