const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const path = require('path');

// Import routes
const adminRouter = require('./routes/adminRoute');
const userRouter = require('./routes/userRoute');

// Load environment variables from .env file
dotenv.config();

// Initialize the app
const app = express();

// Middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'yourSecretKey', // Use environment variable for security
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if using HTTPS
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static('public')); // Serve static files
app.set('view engine', 'ejs'); // Set view engine to EJS

// Passport configuration
require('./config/passport_setup');
app.use(passport.initialize());
app.use(passport.session());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected...'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/', adminRouter);  // For admin routes
app.use('/', userRouter);             // For user routes

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
