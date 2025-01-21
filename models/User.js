const mongoose = require('mongoose');

const userSchema = new mongoose.Schema
   
  userSchema.index({ email: 1 }); // Ini sudah cukup
  

// Membuat model User
const User = mongoose.model('User', userSchema);

module.exports = User;
