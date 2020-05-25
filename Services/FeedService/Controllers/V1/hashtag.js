const express = require('express');
const redis = require('redis');
const feedsModel = require('../../models/feed.js');
const hashModel = require('../../models/hashtag.js');

const client = redis.createClient(6379, 'redis');
const { Feed } = feedsModel;
const { Hash } = hashModel;
const router = express.Router();

router.post('/', async (req, res) => {
  const { hashtag } = req.body;
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;
  const feeds = await Feed.find()
    .where('hashtag')
    .in(hashtag)
    .sort('-createAt')
    .skip(skip)
    .limit(parseInt(limit));
  res.status(200).json(feeds);
});

router.post('/tag', async (req, res) => {
  const { hashtag } = req.body;
  const hashs = await Hash.find({ hashtag: { $regex: hashtag } }).distinct('hashtag');
  res.status(200).json({ tag: hashs });
});

module.exports = router;
