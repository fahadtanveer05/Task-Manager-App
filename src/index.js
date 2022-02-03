const express = require('express')

// calling db file to insure it runs, dont need to fetch anything from the file
require('./db/mongoose')

// loading routes
const userRouter = require('./routers/user')
const taskRouter = require('./routers/task')

const app = express()
const port = process.env.PORT || 3000

// parses incoming json to an object, so we can access its request
app.use(express.json())

// allows express app to use the router
app.use(userRouter)
app.use(taskRouter)

app.listen(port, () => {
    console.log('Server is up on port ' + port)
})

