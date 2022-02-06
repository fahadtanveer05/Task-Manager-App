// Extracted express features to this file except app.listen so we can use it for testing

const express = require('express')

// calling db file to insure it runs, dont need to fetch anything from the file
require('./db/mongoose')

// loading routes
const userRouter = require('./routers/user')
const taskRouter = require('./routers/task')

const app = express()

// parses incoming json to an object, so we can access its request
app.use(express.json())

// allows express app to use the router
app.use(userRouter)
app.use(taskRouter)

module.exports = app