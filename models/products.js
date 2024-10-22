const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    stockQuantity: { type: Number, required: true },
    stockStatus: { type: String, enum: ['In Stock', 'Out of Stock'], required: true },
    attributes: { type: Map, of: String },
    shippingInfo: { type: String },
    rating: { type: Number },
    reviews: [String],
    images: [String],
    dateAdded: { type: Date, default: Date.now },
    dateDeleted: { type: Date },
    isDelete: { type: Boolean, default: false }
});

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);
module.exports = Product;
