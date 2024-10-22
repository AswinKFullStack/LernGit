// services/OTPService.js

const crypto = require('crypto');

// Function to generate OTP
function generateOTP(email) {
  const otp = crypto.randomInt(100000, 999999); // Generate a 6-digit OTP
  // Save OTP to database or in-memory store with expiration
  // For demonstration, we are returning it
  return otp;
}

// Function to verify OTP
function verifyOTP(email, otp) {
  // Retrieve OTP from database or in-memory store and compare
  // For demonstration, assuming OTP is valid
  return true;
}

module.exports = {
  generateOTP,
  verifyOTP
};
