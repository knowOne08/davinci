const mongoose = require('mongoose');

const updatersSchema = new mongoose.Schema({
    uid:{
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    // streakCount: {
    //     count: {
    //         type: Number,
    //         required: true
    //     },  
    //     done: {
    //         type: Boolean,
    //         required: true
    //     }
    // },
    
    // remove this
    streakDone:{
        type: Boolean,
        required: true
    },
    streakCount: {
        type: Number,
        required: true
    },

    noOfCommits: {
        type: Number,
        required: true,
        default: 0
    }

})

module.exports = mongoose.model('updaters', updatersSchema,'updaters')