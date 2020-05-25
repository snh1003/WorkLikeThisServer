const express = require('express');
const redis = require('redis');
const redisServer = redis.createClient(6379, 'redis');
const jwt = require('jsonwebtoken');
const userModel = require('../../models/users.js');
require('dotenv').config();
const jwtSecret = process.env.JWT_PASSWORD;

const { OAuth2Client } = require('google-auth-library');
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const client = new OAuth2Client(CLIENT_ID);

const router = express.Router();

// 토큰 발행 및 레디스 저장 함수
const tokenAndRedis = (user) => {
  let token = jwt.sign({ id: user._id }, jwtSecret, {
    expiresIn: 86400,
    subject: 'userID',
  });

  if (user.username) {
    redisServer.hmset(
      token,
      {
        "_id": `${user._id}`,
        "username": `${user.username}`,
        "userImage": `${user.userImage}`,
        "job": `${user.job}`,
        "hashtag": `${user.hashtag}`,
      },
      redis.print
    );
    redisServer.expire(token, 86400);
  } else {
    redisServer.hmset(
      token,
      {
        "_id": `${user._id}`,
      },
      redis.print
    );
    redisServer.expire(token, 86400);
  }
  

  return token;
}

// 구글 로그인 (db에 email 정보 있으면 로그인 없으면 생성 후 205코드 반환)
router.post('/signin', (req, res) => {
  console.log(req.body.id_token);
  async function verify() {
    const ticket = await client.verifyIdToken({
      idToken: req.body.id_token,
    });
    const payload = ticket.getPayload();
    const googleEmail = payload['email'];
    const googleImage = payload['picture'];
    const user = await userModel.findOne({ email: googleEmail });
    
    if (user === null) {
      const googleUser = new userModel({
        email: googleEmail,
        userImage: googleImage,
        from: 'google',
      });

      const saveUser = await googleUser.save();
      const token = tokenAndRedis(saveUser);

      res.status(205).json({
        _id: saveUser._id,
        email: saveUser.email,
        userImage: saveUser.userImage,
        token: token
      });
    } else {
      const token = tokenAndRedis(user);
      res.status(200).json({
        _id: user._id,
        username: user.username,
        userImage: user.userImage,
        token: token
      });
    }
  }
  verify().then(() => {}).catch(console.error);
});

module.exports = router;

