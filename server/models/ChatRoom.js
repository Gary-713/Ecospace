const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ChatRoomSchema = new Schema({
    participants: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        }
    ],
    messages: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Message',
            default: []  // Default as an empty array

        }
    ],
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastUpdatedAt: {  // Track last update timestamp
        type: Date,
        default: Date.now
    }
});


// Middleware to update lastUpdatedAt when a new message is added
ChatRoomSchema.pre('save', function (next) {
    if (this.isModified('messages')) {
        this.lastUpdatedAt = new Date();
    }
    next();
});
module.exports = mongoose.model('ChatRoom', ChatRoomSchema);
