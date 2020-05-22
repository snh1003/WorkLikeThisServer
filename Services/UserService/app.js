/* eslint-disable no-unused-vars */
const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// DB
mongoose.Promise = global.Promise;
const username = process.env.MONGODB_ADMIN_NAME;
const password = process.env.MONGODB_ADMIN_PWD;

mongoose.connect(`mongodb://${username}:${password}@user-db:27017/users`, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  auth: { authSource: 'admin' },
});

// Server
app.use(cors());

app.use(express.json());

app.use(require('./Controllers'));

app.use(express.urlencoded({ extended: true }));

app.listen(process.env.PORT || 5001, () => {
  console.log(`connect${process.env.PORT}`);
});
