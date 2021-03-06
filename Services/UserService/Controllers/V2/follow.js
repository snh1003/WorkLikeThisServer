require('dotenv').config();
const express = require('express');
const redis = require('redis');
const redisServer = redis.createClient(process.env.REDIS_PORT, 'redis');
const userModel = require('../../models/users.js');
const followInfomodel = require('../../models/follwerInfo.js');

const router = express.Router();

// 팔로우 요청시 팔로우 등록(유효한 회원인지 확인)
// db에서 어떻게 중복검사를 할 지 몰라서 팔로우 컬렉션 색인해서 값 넣을 수 있도록 하였습니다.
// 좋은 아이디어 있으면 피드백 주세요 !
router.post('/', async (req, res) => {
  try {
    const token = req.headers.authorization.slice(7);
    const user = await userModel.findOne({ username: req.body.username });
    redisServer.hgetall(token, async (err, result) => {
      if (!err) {
        try {
          const isFollowing = await followInfomodel.findOne({
            userId: result._id,
            follow: user._id
          });

          if (!isFollowing && (result._id !== `${user._id}`)) {
            const following = new followInfomodel({
              userId: result._id,
              follow: user._id
            });

            following
              .save()
              .then(() => {
                res.status(204).end();
              })
              .catch(() => {
                res.status(409).send('Failed');
              });
          } else {
            res.status(403).send('Forbidden');
          }
        } catch (err) {
          res.status(401).send('Unauthorized');
        }
      } else {
        res.status(401).send('Unauthorized');
      }
    });
  } catch (err) {
    res.status(400).send('Bad Request');
  }
});


// 팔로우 취소 시 팔로우 삭제(유효한 회원인지 확인)
// 만약 데이터가 없을 때에도 204 코드 반환하는 에러 
// 프론트에서 클라이언트에 팔로우 변화만 잘 일어나면 문제가 없을 것 같아서 일단 수정은 안했습니다.
router.delete('/', async (req, res) => {
  try {
    const token = req.headers.authorization.slice(7);
    const user = await userModel.findOne({ username: req.body.username })
    redisServer.hgetall(token, (err, result) => {
      if (!err) {
        try {
          followInfomodel.findOneAndRemove({
            userId: result._id,
            follow: user._id
          })
            .then(() => {
              res.status(204).end();
            })
            .catch(() => {
              res.status(404).send('Not Found');
            });
        } catch {
          res.status(401).send('Unauthorized');
        }
      } else {
        res.status(401).send('Unauthorized');
      }
    });
  } catch {
    res.status(400).send('Bad Request');
  }
});

module.exports = router;