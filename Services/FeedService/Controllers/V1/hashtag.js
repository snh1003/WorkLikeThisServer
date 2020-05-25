const express = require('express');
const redis = require('redis');
const model = require('../../models/feed.js');

const client = redis.createClient(6379, 'redis');
const { Feed } = model;
const router = express.Router();


module.exports = router;
