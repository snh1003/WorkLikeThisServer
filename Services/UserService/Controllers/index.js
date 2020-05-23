const express = require('express');
const accounts = require('./V1/accounts.js');
const profile = require('./V1/profile.js');
const follow = require('./V1/follow.js');

const router = express.Router();

router.use('/api/v1/accounts', accounts);
router.use('/api/v1/profile', profile);
router.use('/api/v1/follow', follow);

module.exports = router;
