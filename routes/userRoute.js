const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Adjust path as needed
const Category = require('../models/category'); // Adjust path if necessary
const Product = require('../models/products'); // Adjust path if needed
const session = require('express-session');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt'); // Ensure bcrypt is included
const crypto = require('crypto'); // For generating random OTPs




// Initialize session middleware
router.use(session({
    secret: 'yourSecretKey', // Replace this with a strong secret key
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // If using HTTPS, set to true
}));

// Create a transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
    service: 'gmail',
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
        user: 'subhanathasni@gmail.com',
        pass: 'snoh frjb ccrv hjcj' // Ensure this is not hardcoded in production
    }
});

// Function to generate a 6-digit OTP
const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Function to send OTP email
const sendOtpEmail = async (to, otp) => {
    const mailOptions = {
        from: 'subhanathasni@gmail.com',
        to: to,
        subject: 'Your OTP Code',
        text: `Your OTP code is ${otp}.`
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('OTP sent successfully:', info.response);
        return info.accepted.length > 0;
    } catch (error) {
        console.error('Error sending OTP:', error);
        throw new Error('Error sending OTP');
    }
};

// Route to render OTP form
router.get('/otp_form', (req, res) => {
    res.render('userSide/otpForm');
});

// Verify OTP route
router.post('/verify_otp', (req, res) => {
    const { otp } = req.body;

    // Assuming OTP is stored in session
    if (otp === req.session.otp) {
        // OTP is correct, proceed with sign-up
        req.session.otp = null; // Clear OTP from session
        return res.redirect('/user_login');
    } else {
        return res.render('userSide/otpForm', {
            errorMessage: 'Invalid OTP. Please try again.'
        });
    }
});

// Route to resend OTP
router.post('/resend_otp', (req, res) => {
    const newOtp = generateOtp(); // Generate new OTP
    req.session.otp = newOtp;
    const email = req.session.email; // Get email from session

    if (!email) {
        return res.status(400).json({ success: false, message: 'Email not found in session' });
    }

    // Send OTP to the user's email
    sendOtpEmail(email, newOtp)
        .then(() => res.json({ success: true }))
        .catch(() => res.status(500).json({ success: false, message: 'Failed to resend OTP' }));
});

// Route handler for home page
router.get('/home', async (req, res) => {
    try {
        const categories = await Category.find(); // Fetch categories from the database
        const products = await Product.find(); // Fetch products from the database
        res.render('userSide/homePage', { categories, products });
    } catch (err) {
        console.error('Error fetching data:', err);
        res.status(500).send('Server Error');
    }
});

// Route to fetch categories
router.get('/categories', async (req, res) => {
    try {
        const categories = await Category.find();
        res.json(categories);
    } catch (error) {
        res.status(500).send('Error fetching data');
    }
});

// Route to fetch products
router.get('/products', async (req, res) => {
    try {
        const products = await Product.find(); // Ensure Product is defined here
        res.json(products);
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).send('Error fetching data');
    }
});

// Route to render user login page
router.get('/user_login', (req, res) => {
    res.render('userSide/login', { errorMessage: null, successMessage: null });
});

// Route to render user signup page
router.get('/user_signup', (req, res) => {
    const { errorMessage, email, username } = req.query;
    res.render('userSide/signup', {
        errorMessage: errorMessage || null,
        successMessage: null,
        email: email || '',
        username: username || ''
    });
});

// Handle user login
router.post('/user_login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.render('userSide/login', {
                errorMessage: 'Invalid email or password',
                successMessage: null
            });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.render('userSide/login', {
                errorMessage: 'Invalid email or password',
                successMessage: null
            });
        }

        // Successful login - set session userId
        req.session.userId = user._id; // Ensure session is initialized
        return res.redirect('/home'); // Redirect to home or protected route
    } catch (error) {
        console.error('Error during login:', error);
        return res.render('userSide/login', {
            errorMessage: 'Internal server error',
            successMessage: null
        });
    }
});

// Handle user signup
router.post('/user_signup', async (req, res) => {
    const { email, username, password, mobileNumber } = req.body;

    try {
        // Check if email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.render('userSide/signup', {
                errorMessage: 'Email already registered',
                email,
                username
            });
        }

        // Create new user with validation for mobileNumber
        const newUser = new User({ email, username, password, mobileNumber: mobileNumber || undefined });
        await newUser.save();

        // Generate OTP and send it to the user
        const otp = generateOtp();
        req.session.otp = otp;
        req.session.email = email;

        await sendOtpEmail(email, otp);

        // Redirect to OTP form page
        return res.redirect('/otp_form');
    } catch (error) {
        console.error('Error during signup:', error);
        return res.render('userSide/signup', {
            errorMessage: 'Internal server error',
            email,
            username
        });
    }
});

router.get('/products', async (req, res) => {
    try {
      const products = await Product.find({ isDelete: false });
      res.render('products', { products });
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).send('Error fetching products');
    }
  });
  
  // Product details view
  router.get('/product/:id', async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);
      if (!product || product.isDelete) {
        return res.status(404).send('Product not found');
      }
  
      // Fetch related products by category
      const relatedProducts = await Product.find({ category: product.category, _id: { $ne: product._id } }).limit(4);
      
      res.render('productDetail', { product, relatedProducts });
    } catch (error) {
      console.error('Error fetching product details:', error);
      res.status(500).send('Error fetching product details');
    }
  });
module.exports = router;
