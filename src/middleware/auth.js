const jwt = require('jsonwebtoken')

const User = require('../models/user')

const auth = async (req, res, next) => {
    try {
        // we use req.header to access incoming headers from client in which our jwt is.
        const bearerToken = req.header('Authorization')
        
        // The request from header contains bearer in it so we split on space to separate our token
        const splitToken = bearerToken.split(' ')
        
        const token = splitToken[1]

        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        // We use find one because we are not directly passing in an id. We are passing a decoded token which contains our id.
        // The second argument looks within our tokens array in the db and sees if it finds a match with the given token. 
        const user = await User.findOne({ _id: decoded, 'tokens.token': token })

        if (!user) {
            // This will trigger the catch block down below
            throw new Error()
        }

        // sending our found user and the token extracted above from within the request to the route handler which is gonna run after this
        req.token = token
        req.user = user
        next()
    } catch (error) {
        res.status(401).send({error: 'Please authenticate'})
    }
}

module.exports = auth