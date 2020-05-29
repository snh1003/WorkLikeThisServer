const express = require('express');
const accounts = require('./V2/accounts.js');
const profile = require('./V2/profile.js');
const follow = require('./V2/follow.js');
const social = require('./V2/social.js');

const router = express.Router();

router.use('/api/v2/accounts', accounts);
router.use('/api/v2/user/profile', profile);
router.use('/api/v2/user/follow', follow);
router.use('/api/v2/social', social);

module.exports = router;
