const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const cors = require('cors');
const User = require('./models/User');  // Mengimpor model User dari file eksternal

dotenv.config();  // Menggunakan variabel environment dari .env

const app = express();
const PORT = process.env.PORT || 3000;

// Mengaktifkan CORS untuk menerima permintaan dari frontend
app.use(cors({
  origin: '*',  // Membuka akses untuk semua domain (pastikan ini sesuai dengan kebutuhan Anda)
}));

// Parsing body JSON
app.use(express.json());

// Koneksi ke MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1); // Keluar jika koneksi gagal
  });

// Endpoint untuk login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Validasi format email
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  try {
    // Cari pengguna berdasarkan email
    const user = await User.findOne({ email });

    if (!user) {
      // Log untuk debugging
      console.log(`User with email ${email} not found`);
      return res.status(400).json({ message: 'User not found' });
    }

    // Bandingkan password yang dimasukkan dengan password yang tersimpan
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      // Log untuk debugging
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

// Menjalankan server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
