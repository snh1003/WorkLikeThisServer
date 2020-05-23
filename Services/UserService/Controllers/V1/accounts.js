const express = require('express');
const jwt = require('jsonwebtoken');
const userModel = require('../../models/users.js');
require('dotenv').config();
const redis = require('redis');
const client = redis.createClient(6379, 'redis');

jwtSecret = process.env.JWT_PASSWORD;

const router = express.Router();

router.post('/signin', async (req, res) => {
  userModel.findOne({ email: req.body.email }, (err, user) => {
    if (err) throw err;
    if (user.interest.length < 1) return res.status(205).send('Fill Interest');

    user.comparePassword(req.body.password, (error, isEqual) => {
      if (error) throw error;

      if (isEqual) {
        const token = jwt.sign({ id: user._id }, jwtSecret, {
          expiresIn: 86400,
          subject: 'userID',
        });

        client.hmset(
          token,
          { "_id": `${user._id}`, "username": `${user.username}`, "userImage": `${user.userImage}` },
          redis.print
        );
        client.expire(token, 86400);

        res.status(200).json({ token });
      } else {
        res.status(401).send('Invalid User');
      }
    });
  });
});

router.post('/signup', (req, res) => {
  const newUser = new userModel({
    email: req.body.email,
    username: req.body.username,
    password: req.body.password,
    interest: req.body.interest,
  });

  newUser
    .save()
    .then(() => {
      res.status(201).send();
    })
    .catch((err) => {
      res.status(409).send('Failed');
    });
});

router.post('/signout', (req, res) => {
  client.del(req.headers.authorization.slice(7), (err, result) => {
    if (!err) {
      res.status(204).end();
    } else {
      res.status(409).send('Failed');
    }
  });
})

module.exports = router;
