const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const Task = require('./task')

// creating schema, to take advantage of middleware
const userSchema = new mongoose.Schema({
    name : {
        type: String,
        required: true,
        trim: true
    },
    email : {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true,
        validate(value) {
            if(!validator.isEmail(value)){
                throw new Error('Email is invalid.')
            }
        }
    },
    password: {
        type: String,
        required: true,
        trim: true,
        minlength: 7,
        validate(value) {
            // if(validator.equals(value, 'password')){
            //     throw new Error('Cannot set password equal to password. Pick out a more secure value.')
            // }

            if(value.toLowerCase().includes('password')){
                throw new Error('Cannot set password equal to password. Pick out a more secure value.')
            }
        }
    },
    age: {
        type: Number,
        default: 0,
        validate(value) {
            if (value < 0){
                throw new Error('Age must be a positive number.')
            }
        }
    },

    // array of objects
    tokens: [{
        // each object has a token property
        token: {
            // token property is made up of:
            type: String,
            required: true
        }
    }],
    // storing profile images
    avatar: {
        type: Buffer
    }
}, {
    // enabling time stamps to know when a user was created and when they were last updated
    timestamps: true
})

// creating a method that we can directly access from the user model
userSchema.statics.findByCredentials = async (email, password) => {
    // find a user who has email equal to the email provided in the request body
    const user = await User.findOne( {email} )

    if(!user){
        // this error will stop the function execution from going forward
        throw new Error('Unable to login')
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if(!isMatch){
        throw new Error('Unable to login')
    }

    return user
}

// Creates a relationship between user and task
// virtual isn't stored in the db, its just gives a way for mongoose to know how these two are related
userSchema.virtual('tasks', {
    ref: 'tasks',
    // primary key
    localField: '_id',
    // foreign key
    foreignField: 'userId'
})

// Statics are accessible on the model while methods are accessible on instances (objects)
userSchema.methods.generateAuthToken = async function () {
    const user = this

    // As user.id is an object id so we need to convert it to a string which the jwt token is expecting
    const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET)

    // saving token for user in db. Concatenating on a new item which will be an object with token property.
    user.tokens = user.tokens.concat({ token })
    await user.save()

    return token
}

userSchema.methods.toJSON = function () {
    const user = this

    // converting our json object back to object type
    const userObject = user.toObject()
    
    // remove stuff off of the object to send back only required data
    delete userObject.password
    delete userObject.tokens
    delete userObject.avatar

    return userObject
}

// providing a middleware to hash password before the user is saved
// needs to be standard function, not an arrow function. because we need to use 'this'
userSchema.pre('save', async function (next) {
    const user = this

    // if the user had a modified password
    // it will be true when a new user is created or if the user is updating the password
    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8)
    }

    // we call next to tell middleware function is over and can go back
    next()
})

// creating a middleware to delete user tasks after user is removed
userSchema.pre('remove', async function (next) {
    const user = this
    
    await Task.deleteMany({ userId: user._id })

    next()
})

// creating model
const User = mongoose.model('users', userSchema)

module.exports = User