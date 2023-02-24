const mongoose = require('mongoose');

const streakerSchema = new mongoose.Schema({
    uid:{
        type: String,
        required: true
    },

    streakCount: {
        type: Number,
        required: true,
        default: 0
    },

    count: {
        type: Number,
        required: true,
        default: 1
    }
})

module.exports = mongoose.model('streakMakers', streakerSchema,'streakMakers')