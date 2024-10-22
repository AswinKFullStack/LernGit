const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, maxlength: 500 },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    isDeleted: { type: Boolean, default: false },
}, {
    timestamps: true
});

const Category = mongoose.models.Category || mongoose.model('Category', categorySchema);
module.exports = Category;
