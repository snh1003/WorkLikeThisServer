const express = require('express');
const jwt = require('jsonwebtoken');
const userModel = require('../../models/users.js');
const followInfoModel = require('../../models/follwerInfo.js');
require('dotenv').config();
const redis = require('redis');
const redisServer = redis.createClient(6379, 'redis');
const nodemailer = require('nodemailer');
const { promisify } = require("util");
const ttl = promisify(redisServer.ttl).bind(redisServer);

const jwtSecret = 'test';

// 이메일 발송 부분
const smptServer = 'smtp.naver.com';
const naverId = 'youngahn11';
const naverPassword = 'jason1';

const router = express.Router();

const makePassword = () => {
  let password = "";
  let text = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (let i = 0; i < 20; i++)
    password += text.charAt(Math.floor(Math.random() * text.length));

  return password;
}

// 로그인 함수 패스워드 확인 후 레디스 key value 저장 및 프론트에 json, token response
router.post('/signin', async (req, res) => {
  try {
    const user = await userModel.findOne({ email: req.body.email });

    if (user !== null) {
      user.comparePassword(req.body.password, (err, isEqual) => {
        if (err) return res.status(401).send('Unauthorized');

        if (isEqual) {
          const token = jwt.sign({ id: user._id }, jwtSecret, {
            expiresIn: 86400,
            subject: 'userID',
          });

          redisServer.hmset(
            token,
            {
              '_id': `${user._id}`,
              'username': `${user.username}`,
              'userImage': `${user.userImage}`,
              'job': `${user.job}`,
              'hashtag': `${user.hashtag}`,
            },
            redis.print
          );
          redisServer.expire(token, 86400);

          if (user.hashtag.length < 1) {
            res.status(205).json({
              _id: user._id,
              username: user.username,
              userImage: user.userImage,
              token: token
            })
          } else {
            res.status(200).json({
              _id: user._id,
              username: user.username,
              userImage: user.userImage,
              job: user.job,
              hashtag: user.hashtag,
              token: token
            });
          }
        } else {
          res.status(401).send('Unauthorized');
        }
      })
    } else {
      res.status(404).send('Not Found');
    }
  } catch {
    res.status(400).send('Bad Request');
  }
});

// 회원가입 함수
router.post('/signup', (req, res) => {
  const newUser = new userModel({
    email: req.body.email,
    username: req.body.username,
    password: req.body.password,
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

// 회원가입 시 해쉬태그 추가
router.patch('/signup', async (req, res) => {
  try {
    const token = req.headers.authorization;
    const body = req.body;
    const user = await redisServer.hgetall(token);
    const result = await userModel.findOneAndUpdate(
      { id: user._id },
      { $set: body },
      {
        new: true,
        returnOriginal: false,
      },
    );

    if (result) {
      const remainTime = await ttl(token);

      redisServer.hmset(
        token,
        {
          '_id': `${user._id}`,
          'username': `${user.username}`,
          'userImage': `${user.userImage}`,
          'job': `${user.job}`,
          'hashtag': `${user.hashtag}`,
        },
        redis.print
      );
      redisServer.expire(token, remainTime);

      res.status(200).json({
        _id: result._id,
        username: result.username,
        userImage: result.userImage,
        job: result.job,
        hashtag: user.hashtag,
      });
    } else {
      res.status(404).send('Not Found');
    }
  } catch {
    res.status(400).send('Bad Request');
  }
});

// 로그아웃
router.post('/signout', async (req, res) => {
  try {
    const token = req.headers.authorization;
    const delToken = await redisServer.del(token);

    if (delToken) {
      res.status(204).end();
    } else {
      res.status(409).send('Failed');
    }
  } catch {
    res.status(400).send('Bad Request');
  }
});

// 유저 탈퇴
// 엔드포인트는 임의로 넣은 거라 변경 가능합니다 :)
router.delete('/secession', async (req, res) => {
  try {
    const token = req.headers.authorization;
    redisServer.hgetall(token, async (err, user) => {
      if (!err) {
        try {
          const delToken = await redisServer.del(token);
          const delUser = await userModel.findByIdAndDelete(user._id);
          const delFollow = await followInfoModel.deleteMany({ userId: user._id });
          const delFollowing = await followInfoModel.deleteMany({ follow: user._id });

          res.status(200).send('Complete');
        } catch {
          res.status(404).send('Not Found');
        }
      } else {
        res.status(401).send('Unauthorized');
      }
    });
  } catch {
    res.status(400).send('Bad Request');
  }
});



router.post('/forgot', async (req, res) => {
  const email = req.body.email;
  const user = await userModel.findOne({ email: email });

  if (user !== null) {
    let newPassword = makePassword();

    const mailOptions = {
      from: 'youngahn11@naver.com',
      to: user.email,
      subject: 'WorkLikeThis에서 임시 비밀번호를 발급해드렸습니다.',
      text: `임시 비밀번호를 발급해드렸습니다.\n ${newPassword} \n 로그인 후 비밀번호를 교체해주세요.`
    };

    const smtpTransport = nodemailer.createTransport({
      host: smptServer,
      secure: true,
      auth: {
        user: naverId,
        pass: naverPassword,
      },
    });

    smtpTransport.sendMail(mailOptions, function (err, info) {
      if (err) {
        return res.status(403).send('Forbidden');
      }
      smtpTransport.close();
      return res.status(200).send('Finished send email');
    });
  } else {
    res.status(404).send('Not Found');
  }
});

module.exports = router;
