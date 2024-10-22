// services/AuthService.js

const bcrypt = require('bcrypt');
const User = require('../models/User'); // Ensure the path is correct

// Function to authenticate user
const authenticate = async (email, password) => {
  try {
    const user = await User.findOne({ email });
    if (!user) return false;

    const isMatch = await bcrypt.compare(password, user.password);
    return isMatch;
  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
};

// Export the function
module.exports = {
  authenticate
};
