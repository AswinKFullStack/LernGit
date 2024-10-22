const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Define the admin schema
const adminSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  username: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  resetToken: String,
  expireToken: Date
});


// Export the model
module.exports = mongoose.model('Admin', adminSchema);