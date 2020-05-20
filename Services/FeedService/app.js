const express = require('express')
const morgan = require('morgan')
const mongoose = require('mongoose')
const app = express()

//DB
mongoose.Promise = global.Promise;
const username = process.env.MONGODB_ADMIN_NAME
const password = process.env.MONGODB_ADMIN_PWD

mongoose.connect(`mongodb://${username}:${password}@localhost:27017/feeds`, {useNewUrlParser : true})

//Server
app.use(express.json())
app.use(require('./Controllers'))
app.use(express.urlencoded({ extended: true }))

app.listen(process.env.PORT || 5000, () => {
    console.log('connect' + process.env.PORT)
})

