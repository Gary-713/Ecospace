const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    username: {
        type: String,
        // required: true
    },
    password: {
        type: String,
        // required: true
    },
    cart: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Cart'
    },
    orders: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        default: []

    }],
    designation: {
        type: String,
        enum: ['buyer', 'seller'],

        // required: true

    },
    chatrooms: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ChatRoom',
            default: []
        }
    ]

});

module.exports = mongoose.model('User', UserSchema);