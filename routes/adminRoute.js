const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/admin');
const authenticateToken = require('../middleware/authMiddleware');
const noCacheMiddleware = require('../middleware/noCacheMiddleware');
const multer = require('multer');
const sharp = require('sharp');
const Customers = require('../models/customers'); // Import customers model
const Category = require('../models/category'); // Import the category model
const Product = require('../models/products'); // Assuming you have a product model
const fs = require('fs');
const path = require('path');
const router = express.Router();
const User = require('../models/User');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/images'); // Directory where files will be saved
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext); // Save file with timestamp to avoid naming conflicts
  }
});

const upload = multer({ storage: storage });

const ensureDirectoryExistence = (filePath) => {
  const dirname = path.dirname(filePath);
  if (!fs.existsSync(dirname)) {
    fs.mkdirSync(dirname, { recursive: true });
  }
};

// JWT Secret Key
const JWT_SECRET = 'your_jwt_secret_key';

// Render Login Page
router.get('/login', (req, res) => {
  res.render('login', { errorMessage: null, successMessage: null });
});

// Render Signup Page
// Example of a route that handles the signup process
router.get('/signup', (req, res) => {
  res.render('signup', { errorMessage: req.query.errorMessage });
});


// Apply no cache middleware to protected routes
router.use('/adminPanel', noCacheMiddleware);

// Render Admin Panel and Specific Sections with Authentication
router.use('/adminPanel', authenticateToken);

router.get('/adminPanel', (req, res) => {
  res.render('adminPanel', { body: 'partials/dashboard' });
});

router.get('/adminPanel/dashboard', (req, res) => {
  res.render('adminPanel', { body: 'partials/dashboard' });
});

router.get('/adminPanel/orders', (req, res) => {
  res.render('adminPanel', { body: 'partials/orders' });
});



// Product route for displaying and searching products
router.get('/adminPanel/products', async (req, res) => {
  try {
      const search = req.query.search || '';
      const page = parseInt(req.query.page) || 1;
      const limit = 10;
      const skip = (page - 1) * limit;

      const products = await Product.find({
          name: { $regex: search, $options: 'i' }
      })
      .skip(skip)
      .limit(limit)
      .populate('category');

      const totalProducts = await Product.countDocuments({
          name: { $regex: search, $options: 'i' }
      });
      const totalPages = Math.ceil(totalProducts / limit);

      const categories = await Category.find();

      res.render('adminPanel', { 
        body: 'partials/products', 
          products,
          categories,
          search,
          currentPage: page,
          totalPages
      });
  } catch (err) {
      console.error(err);
      res.status(500).send('Server Error');
  }
});

// POST Add Product
router.post('/adminPanel/products/add', upload.array('images', 3), async (req, res) => {
  try {
      const { name, description, price, category, stockQuantity, stockStatus } = req.body;
      const images = req.files.map(file => file.path);  // Check if paths are correct
      
      const newProduct = new Product({
          name,
          description,
          price,
          category,
          stockQuantity,
          stockStatus,
          images
      });

      await newProduct.save();
      res.redirect('/adminPanel/products');
  } catch (err) {
      console.error(err);
      res.status(500).send('Server Error');
  }
});

// POST Edit Product
router.post('/adminPanel/products/edit/:id', upload.array('images', 3), async (req, res) => {
  try {
      const { name, description, price, category, stockQuantity, stockStatus } = req.body;
      let images = req.files.map(file => file.path.replace(/\\/g, '/')); // Convert backslashes to forward slashes

      // If no new images are uploaded, retain the existing ones
      if (images.length === 0) {
          const existingProduct = await Product.findById(req.params.id);
          images = existingProduct.images;
      }

      await Product.findByIdAndUpdate(req.params.id, {
          name,
          description,
          price,
          category,
          stockQuantity,
          stockStatus,
          images
      });

      res.redirect('/adminPanel/products');
  } catch (err) {
      console.error(err);
      res.status(500).send('Server Error');
  }
});

// POST Toggle Product Status
router.post('/adminPanel/products/toggle/:id', async (req, res) => {
  try {
      const productId = req.params.id;
      const product = await Product.findById(productId);

      product.isDelete = !product.isDelete;
      if (product.isDelete) {
          product.dateDeleted = Date.now();
      } else {
          product.dateDeleted = null;
      }

      await product.save();
      res.redirect('/adminPanel/products');
  } catch (err) {
      console.error(err);
      res.status(500).send('Server Error');
  }
});

// GET View Product
router.get('/adminPanel/products/view/:id', async (req, res) => {
  try {
      const productId = req.params.id;
      const product = await Product.findById(productId).populate('category');
      res.render('viewProduct', { product });
  } catch (err) {
      console.error(err);
      res.status(500).send('Server Error');
  }
});

// category
router.post('/adminPanel/category/add', async (req, res) => {
  const { name, description, status } = req.body;
  console.log('Received Add Request:', { name, description, status }); // Debug line

  const newCategory = new Category({
      name,
      description,
      status: status === 'active' ? 'active' : 'inactive', // Handle the checkbox value
  });

  try {
      await newCategory.save();
      res.redirect('/adminPanel/category');
  } catch (err) {
      console.error('Error Saving Category:', err); // Debug line
      res.redirect('/adminPanel/category');
  }
});


// View categories with pagination, search, and filters
router.get('/adminPanel/category', async (req, res) => {
  const { search = '', page = 1, limit = 10, status } = req.query;
  const query = { isDeleted: false };

  // If search is provided, add it to the query
  if (search) {
      query.name = { $regex: search, $options: 'i' };
  }

  if (status) query.status = status;

  const categories = await Category.find(query)
      .skip((page - 1) * limit)
      .limit(limit);
  
  const totalCategories = await Category.countDocuments(query);

  res.render('adminPanel', { 
      body: 'partials/category', 
      categories, 
      currentPage: page, 
      totalPages: Math.ceil(totalCategories / limit),
      search // Pass search term to the view
  });
});


router.post('/adminPanel/category/edit/:id', async (req, res) => {
  const { name, description, status } = req.body;
  console.log('Received Edit Request:', { id: req.params.id, name, description, status }); // Debug line

  try {
      await Category.findByIdAndUpdate(req.params.id, {
          name,
          description,
          status: status === 'active' ? 'active' : 'inactive', // Handle the checkbox value
      });
      res.redirect('/adminPanel/category');
  } catch (err) {
      console.error('Error Updating Category:', err); // Debug line
      res.redirect('/adminPanel/category');
  }
});

router.post('/adminPanel/category/delete/:id', async (req, res) => {
  await Category.findByIdAndUpdate(req.params.id, { isDeleted: true });
  res.redirect('/adminPanel/category');
});

router.post('/adminPanel/category/bulk', async (req, res) => {
  const { action, selectedCategories } = req.body;

  if (action === 'delete') {
      await Category.updateMany({ _id: { $in: selectedCategories } }, { isDeleted: true });
  } else if (action === 'status') {
      await Category.updateMany({ _id: { $in: selectedCategories } }, { status: req.body.status });
  }

  res.redirect('/adminPanel/category');
});
    
// Admin route to render the admin panel with customer list

router.get('/adminPanel/customers', async (req, res) => {
  try {
    // Fetch search query from request (if available)
    const searchQuery = req.query.search || '';

    // Fetch customers based on the search query
    let customers;
    if (searchQuery) {
      customers = await Customers.find({
        $or: [
          { name: new RegExp(searchQuery, 'i') }, // Case-insensitive search by name
          { email: new RegExp(searchQuery, 'i') } // Case-insensitive search by email
        ]
      });
    } else {
      customers = await Customers.find(); // Fetch all customers if no search query
    }

    // Render the customer management page, passing the search query and customers
    res.render('adminPanel', {
      body: 'partials/customers',
      customers: customers,
      search: searchQuery,
      totalPages: 5, // Replace with your pagination logic if necessary
      currentPage: 1 // Replace with your current page logic if necessary
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).send('Server Error');
  }
});


// Block/Unblock Customer
router.post('/adminPanel/customers/toggle-status/:id', async (req, res) => {
  try {
      const customerId = req.params.id;
      const customers = await Customers.findById(customerId);

      if (!customers) {
          return res.status(404).send('Customer not found');
      }

      // Toggle customer status between active and blocked
      customers.status = customers.status === 'active' ? 'blocked' : 'active';
      await customers.save();

      res.redirect('/adminPanel/customers');
  } catch (error) {
      console.error('Error toggling customer status:', error);
      res.status(500).send('Server Error');
  }
});

// Edit Customer
router.post('/adminPanel/customers/edit/:id', async (req, res) => {
  try {
      const customerId = req.params.id;
      const { name, email } = req.body; // Assuming name and email fields for edit

      // Find and update customer details
      const customers = await Customers.findByIdAndUpdate(
          customerId,
          { name, email },
          { new: true }
      );

      if (!customers) {
          return res.status(404).send('Customer not found');
      }

      res.redirect('/adminPanel/customers');
  } catch (error) {
      console.error('Error editing customer:', error);
      res.status(500).send('Server Error');
  }
});


router.get('/adminPanel/offers', (req, res) => {
  res.render('adminPanel', { body: 'partials/offers' });
});

router.get('/adminPanel/settings', (req, res) => {
  res.render('adminPanel', { body: 'partials/settings' });
});

// Logout Route
router.get('/logout', (req, res) => {
  res.clearCookie('token'); // Clear the JWT token cookie
  res.redirect('/login'); // Redirect to the login page
});

// Signup Route
router.post('/signup', async (req, res) => {
  const { email, username, password } = req.body;
  const passwordRegex = /^(?=.*[0-9])(?=.{8,})/;
  let errorMessage = '';
  let passwordError = false;

  // Password validation
  if (!passwordRegex.test(password)) {
    passwordError = true;
    errorMessage = 'Password must be at least 8 characters long and contain at least one number.';
  }

  try {
    // Check if user already exists
    const existingUser = await Admin.findOne({ email });
    if (existingUser) {
      req.session.errorMessage = 'Email already exists.';
      return res.redirect('/signup');
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save the new user
    const newUser = new Admin({
      email,
      username,
      password: hashedPassword,
    });
    await newUser.save();

    req.session.successMessage = 'Signup successful. Please log in.';
    res.redirect('/login');
  } catch (error) {
    console.error('Error during signup:', error);
    req.session.errorMessage = 'Server error during signup.';
    res.redirect('/signup');
  }
});



// Login Route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if the admin exists
    const admin = await Admin.findOne({ email });
    if (!admin) {
      console.log(`Admin not found for email: ${email}`);
      return res.render('login', { errorMessage: 'Invalid email or password.', successMessage: null });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    if (hashedPassword !== admin.password) {
      console.log(`Password mismatch for email: ${email}`);
      return res.render('login', { errorMessage: 'Invalid email or password.', successMessage: null });
    }

    const token = jwt.sign({ id: admin._id }, JWT_SECRET, { expiresIn: '1h' });

    res.cookie('token', token, { httpOnly: true });
    console.log(`Login successful for email: ${email}`);

    // Redirect to the admin panel
    res.redirect('/adminPanel');
  } catch (err) {
    console.error('Error during login:', err);
    return res.render('login', { errorMessage: 'Server error. Please try again later.', successMessage: null });
  }
});


module.exports = router;