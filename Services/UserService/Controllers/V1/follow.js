const express = require('express');
const redis = require('redis');
const client = redis.createClient(6379, 'redis');
const userModel = require('../../models/users.js');
const followInfomodel = require('../../models/follwerInfo.js');

const router = express.Router();

// 팔로우 요청시 팔로우 등록(유효한 회원인지 확인)
// db에서 어떻게 중복검사를 할 지 몰라서 팔로우 컬렉션 색인해서 값 넣을 수 있도록 하였습니다.
// 좋은 아이디어 있으면 피드백 주세요 !
router.post('/', async (req, res) => {
  try {
    const user = await userModel.findOne({username: req.body.username});
    client.hgetall(req.headers.authorization, async (err, result) => {
      if (!err) {
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
            .catch(err => {
              res.status(409).send('Failed');
            })
        } else {
          res.status(403).send('Forbidden');
        }
      } else {
        res.status(401).send('Unauthorized');
      }
    })  
  } catch (err) {
    res.status(400).send('Bad Request');
  }
});


// 팔로우 취소 시 팔로우 삭제(유효한 회원인지 확인)
// 만약 데이터가 없을 때에도 204 코드 반환하는 에러 
// 프론트에서 클라이언트에 팔로우 변화만 잘 일어나면 문제가 없을 것 같아서 일단 수정은 안했습니다.
router.delete('/', async (req, res) => {
  try {
    const user = await userModel.findOne({username: req.body.username})
    client.hgetall(req.headers.authorization, (err, result) => {
      if (!err) {
        followInfomodel.findOneAndRemove({ 
          userId: result._id,
          follow: user._id
        })
        .then(() => {
          res.status(204).end();
        })
        .catch(err => {
          res.status(404).send('Not Found');
        });
      } else {
        res.status(401).send('Unauthorized');
      }
    })
  } catch (err) {
    res.status(400).send('Bad Request');
  }
});

module.exports = router;
