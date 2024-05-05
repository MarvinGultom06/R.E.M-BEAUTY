const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
    product: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: [1, 'Quantity can not be less then 1.']
    },
    price: {
        type: Number,
        required: true
    },
    totalPrice: {
        type: Number,
        required: true
    },
    image: {
        type: String,
        required: true
    }
});

const CartItem = mongoose.model('CartItem', cartItemSchema);

module.exports = CartItem;