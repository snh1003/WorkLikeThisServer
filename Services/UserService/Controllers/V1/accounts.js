const express = require('express');
const jwt = require('jsonwebtoken');
const userModel = require('../../models/users.js');
const followInfoModel = require('../../models/follwerInfo.js');
require('dotenv').config();
const bcrypt = require('bcrypt');
const redis = require('redis');
const redisServer = redis.createClient(process.env.REDIS_PORT, 'redis');
const nodemailer = require('nodemailer');
const { promisify } = require("util");
const ttl = promisify(redisServer.ttl).bind(redisServer);

const jwtSecret = process.env.JWT_PASSWORD;

// 이메일 발송 부분
const smptServer = process.env.SMPT_SERVER;
const emailId = process.env.EMAIL_ID;
const emailPassword = process.env.EMAIL_PASS;

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
      res.status(409).send(err);
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

// 패스워드 변경 로직 기존 패스워드 확인 후 변경 작업
router.post('/password', async (req, res) => {
  const token = req.headers.authorization;
  try {
    redisServer.hgetall(token, async (err, user) => {
      const userInfo = await userModel.findById(user._id);

      userInfo.comparePassword(req.body.password, async (err, isEqual) => {
        console.log(isEqual);
        if (isEqual) {
          const salt = bcrypt.genSaltSync(10);
          const hash = bcrypt.hashSync(req.body.newPassword, salt);
          const passUpdate = await userModel.findOneAndUpdate(
            { _id: user._id },
            { $set: { password: hash } },
            {
              new: true,
              returnOriginal: false,
            },
          );

          if (passUpdate) {
            res.status(200).send('Success');
          } else {
            res.status(202).send('Accept');
          }
        } else {
          res.status(401).send('Unauthorized');
        }
      });
    });
  } catch {
    res.status(400).send('Bad Request');
  }
});

// 가입 유저의 메일로 임시 비밀번호 발급
router.post('/forgot', async (req, res) => {
  try {
    const email = req.body.email;
    let newPassword = makePassword();
    let updatePassword;

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(newPassword, salt);
    updatePassword = hash;

    const passUpdate = await userModel.findOneAndUpdate(
      { email: email },
      { $set: { password: updatePassword } },
      {
        new: true,
        returnOriginal: false,
      },
    );

    if (passUpdate && passUpdate.from === 'local') {
      const mailOptions = {
        from: 'worklikethis@naver.com',
        to: passUpdate.email,
        subject: 'WorkLikeThis에서 임시 비밀번호를 발급해드렸습니다.',
        text: `${passUpdate.username}님의 임시 비밀번호입니다.\n로그인 후 비밀번호를 변경해주세요 :)\n\n\n${newPassword}`,
      };

      const smtpTransport = nodemailer.createTransport({
        host: smptServer,
        secure: true,
        auth: {
          user: emailId,
          pass: emailPassword,
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
  } catch {
    res.status(400).send('Bad Request');
  }
});

module.exports = router;
