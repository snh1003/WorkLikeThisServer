const express = require('express');
const redis = require('redis');
const redisServer = redis.createClient(6379, 'redis');
const jwt = require('jsonwebtoken');
const userModel = require('../../models/users.js');
require('dotenv').config();
const jwtSecret = process.env.JWT_PASSWORD;

const  {OAuth2Client } = require('google-auth-library');
const CLIENT_ID = proccess.env.GOOGLE_CLIENT_ID
const client = new OAuth2Client(CLIENT_ID);

const router = express.Router();

const tokenAndRedis = (user) => {
  let token = jwt.sign({ id: user._id }, jwtSecret, {
    expiresIn: 86400,
    subject: 'userID',
  });

  redisServer.hmset(
    token,
    { 
      "_id": `${user._id}`, 
      "username": `${user.username}`, 
      "userImage": `${user.userImage}` 
    },
    redis.print
  );
  redisServer.expire(token, 86400);

  return token;
}

router.post('/signin', (req, res) => {
  async function verify() {
    const ticket = await client.verifyIdToken({
      idToken: req.body.token,
    });
    const payload = ticket.getPayload();
    const googleId = payload['sub'];
    const googleEmail = payload['email'];
    const googleName = payload['name'];
    const googleImage = payload['picture'];

    const user = await userModel.findOne({email: userEmail});

    if (user === null) {
      const googleUser = new userModel({
        email: googleEmail,
        username: googleName,
        userImage: googleImage,
      });

      const saveUser = await googleUser.save();
      res.status(205).send('Fill Interest');
    } else {
      const token = tokenAndRedis(user);
      res.status(200).json({ token });
    }
  }
  verify().then(() => {}).catch(console.error);
});

router.patch('', async (req, res) => {
  try {
    const body = req.body;
    const result = await userModel.findOneAndUpdate(
      { id: user._id },
      { $set: body },
      {
        new: true,
        returnOriginal: false,
      },
    );

    if (result) {
      const token = tokenAndRedis(result);
      res.status(200).json({ token });
    } else {
      res.status(404).send('Not Found');
    }
  } catch {
    res.status(400).send('Bad Request');
  }
});

module.exports = router;

