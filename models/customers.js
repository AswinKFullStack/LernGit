const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
    street: String,
    city: String,
    state: String,
    zip: String,
    country: String
});

const customerSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    isBlocked: { type: Boolean, default: false },
    addresses: [addressSchema],
});

const Customer = mongoose.model('Customers', customerSchema);
module.exports = Customer;
