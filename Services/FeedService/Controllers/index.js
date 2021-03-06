const express = require('express');
const feeds = require('./V1/feeds.js');
const comments = require('./V1/comments.js');
const search = require('./V1/hashtag.js');

const router = express.Router();

router.use('/feeds', feeds);
router.use('/comments', comments);
router.use('/search', search);

module.exports = router;
