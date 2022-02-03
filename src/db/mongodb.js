// Not used in the project anymore

// const mongodb = require('mongodb')
// const MongoClient = mongodb.MongoClient
// const ObjectID = mongodb.ObjectId

const {MongoClient, ObjectId} = require('mongodb') 

const url = 'mongodb://127.0.0.1:27017'
const databaseName = 'task-manager'

MongoClient.connect(url, {useNewUrlParser: true}, (error, client) => {
    if(error){
        return console.log('Unable to connect to database')
    }

    console.log('Connected to MongoDB')

    // to create database in mongodb or get access to an existing one
    const db = client.db(databaseName)

    
})