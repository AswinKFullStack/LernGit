const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  images: [{ type: String, required: true }],  // Array of image URLs
  stock: { type: Number, required: true },
  description: { type: String, required: true },
  highlights: [String],                        // Array for product specifications
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  ratings: { type: Number, default: 0 },
  reviews: [{ user: String, review: String }],  // Array of reviews with user
  discounts: { type: Number, default: 0 },      // Discounts in percentage
  isDelete: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
