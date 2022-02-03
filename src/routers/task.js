const express = require('express')

const Task = require('../models/task')

const auth = require('../middleware/auth')

const router = new express.Router()

router.post('/tasks', auth, async (req, res) => {
    const task = new Task({
        // extracts out all the properties from body to the object
        ...req.body,
        userId: req.user._id
    })

    try {
        await task.save()
        res.status(201).send(task)
    } catch (error) {
        res.status(400).send(error)
    }
})

// Implementing pagination and sorting:

// e.g. GET/tasks?completed=false 
// We use query string to make our url dynamic and gives us a way to deal with that dynamic request

// to use pagination we use limit and skip
// Get/tasks?limit=10&skip=10
// limit allows us to limit the number of results for any request
// skip allows us to skip through a set of told results

// GET/tasks/sortBy=createdAt:desc
router.get('/tasks', auth, async (req, res) => {
    const match = {}
    const sort = {}

    // we check if the incoming query contains a completed value
    if (req.query.completed) {
        // we check if the incoming query does equal to true then we set our match completed equal to true and vice versa for false
        // do this to check boolean, since we cant check them directly as the query is a string
        match.completed = req.query.completed === 'true'
    }

    if (req.query.sortBy) {
        const split = req.query.sortBy.split(':')

        // ascending is 1
        // descending is -1
        // splitting query and taking out the asc / desc part
        // the value after ? is which we get if condition is true, the value after colon is what we get if condition is false
        // we use [] before split since we dont have a static object, we use what the user provides us.
        sort[split[0]] = split[1] === 'desc' ? 1 : -1
    }

    try {
        await req.user.populate({
            path: 'tasks',
            // match is an object that helps us populate the data that matches
            match,
            // options property can be used for pagination and for sorting
            options: {
                // setting the limit and skip equal to what the user provides in the query
                limit: req.query.limit,
                skip: req.query.skip,
                sort
            }
        })
        res.send(req.user.tasks)
    } catch (error) {
        res.status(500).send()
    }
})

router.get('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id
    try {
        // const task = await Task.findById(_id)

        const task = await Task.findOne( {_id, userId: req.user._id} )

        if(!task){
            return res.status(404).send()
        }
        res.send(task)
    } catch (error) {
        res.status(500).send()
    }
})

router.patch('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id
    const body = req.body

    const allowedUpdates = ['description', 'completed']

    const updates = Object.keys(body)

    const isValid = updates.every((update) => {
        return allowedUpdates.includes(update)
    })

    if (!isValid) {
        return res.status(400).send('Invalid Updates')
    }

    try {
        const task = await Task.findOne({_id, userId: req.user._id})

        //const task = await Task.findByIdAndUpdate(_id, body, {new: true, runValidators: true})

        if(!task){
            return res.status(404).send()
        }

        updates.forEach((update) => {
            task[update] = body[update]
        })

        await task.save()
        
        res.send(task)
    } catch (error) {
        res.status(400).send(error)
    }
})

router.delete('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id

    try {
        const task = await Task.findOneAndDelete({_id, userId: req.user._id})
        
        if(!task){
            return res.status(404).send()
        }

        res.send(task)
    } catch (error) {
        res.status(500).send(error)
    }
})

module.exports = router