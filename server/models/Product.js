const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ProductSchema = new Schema({

    title: {
        type: String,
        // required: true
    },
    price: {
        type: Number,
        // required: true
    },
    imageURL: {
        type: String,
        // required: true
    },
    category: {
        type: String,
        enum: ['Fruit', 'Vegetable', 'Farm Tool', 'Animal Produce'],
        // required: true
    },
    seller: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        // required: true
    }
});

module.exports = mongoose.model('Product', ProductSchema);