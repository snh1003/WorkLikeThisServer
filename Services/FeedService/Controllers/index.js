const express = require('express');
const feeds = require('./V1/feeds.js');

const router = express.Router();

router.use('/feeds', feeds);

module.exports = router;
