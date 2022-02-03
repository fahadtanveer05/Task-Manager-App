const mongoose = require('mongoose')
const validator = require('validator')
const User = require('../models/user')

const taskSchema = new mongoose.Schema({
    description : {
        type: String,
        trim: true,
        required: true
    },
    completed : {
        type: Boolean,
        default: false
    },
    userId: {
        // this will be an object id
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        // creating a reference of the task with the User model. By doing this, now we can fetch the entire user profile whenever we have access to an individual task.
        ref: 'users'
    }
}, {
    timestamps: true
})

const Task = mongoose.model('tasks', taskSchema)

module.exports = Task