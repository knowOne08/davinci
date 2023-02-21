const mongoose = require('mongoose');

const updatersSchema = new mongoose.Schema({
    uid:{
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    }
})

module.exports = mongoose.model('updaters', updatersSchema,'updaters')