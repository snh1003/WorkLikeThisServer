const express = require('express');
const redis = require('redis');
const client = redis.createClient(6379, 'redis');
const userModel = require('../../models/users.js');
const followInfoModel = require('../../models/follwerInfo.js');

const router = express.Router();

// Array 내 Object에서 필요한 key value 값을 Array에 담아주는 함수
const makeSearchArr = (JSONArr, value) => {
  const len = JSONArr.length;
  let arr = [];
  for (let i=0; i<len; i++) {
    arr.push(JSONArr[i][value]);
  }
  return arr;
}

// 자신의 프로필 데이터
router.get('/', async (req, res) => {
  try {
    client.hgetall(req.headers.authorization, async (err, user) => {
      if (!err) {
        try {
          const userInfo = await userModel.findById(user._id);
          if (user) {
            res.status(200).json({
              _id: userInfo._id,
              username: userInfo.username,
              userImage: userInfo.userImage,
              interest: userInfo.interest
            });
          } else {
            res.status(404).send('Not Found');
          }
        } catch (err) {
          res.status(401).send('Unauthorized');
        }
      } else {
        res.status(401).send('Unauthorized');
      }
    })
  } catch (err) {
    res.status(400).send('Bad Request');
  }
})


// 상대방 프로필에 들어갔을 때
router.get('/:id', (req, res) => {

})

// TODO
// 유저 정보 변경 시 
router.patch('/', (req, res) => {
})


//나를 팔로우하는 유저 정보
router.get('/follower', async (req, res) => {
  try {
    client.hgetall(req.headers.authorization, async (err, user) => {
      if (!err) {
        try {
          const follower = await followInfoModel.find()
          .where('follow')
          .equals(user._id)
          .select('userId');
        
          if (follower) {
            const followUser = makeSearchArr(follower, 'userId');
            
            const followerInfo = await userModel.find()
              .where('_id')
              .in(followUser)
              .select('username userImage');
    
            if (followerInfo) {
              res.status(200).json(followerInfo);
            } else {
              res.status(404).send('Not Found');
            }
          } else {
            res.status(404).send('Not Found');
          }
        } catch (err) {
          res.status(401).send('Unauthorized');
        }
      } else {
        res.status(401).send('Unauthorized');
      }
    })
  } catch (err) {
    res.status(400).send('Bad Request');
  }
});

// 내가 팔로우 하고 있는 유저 정보
router.get('/following', async (req, res) => {
  try {
    client.hgetall(req.headers.authorization, async (err, user) => {
      if (!err) {
        try {
          const following = await followInfoModel.find()
          .where('userId')
          .equals(user._id)
          .select('follow');
        
          if (following) {
            const followingUser = makeSearchArr(following, 'follow');
    
            const followingInfo = await userModel.find()
              .where('_id')
              .in(followingUser)
              .select('username userImage');
    
            if (followingInfo) {
              res.status(200).json(followingInfo);
            } else {
              res.status(404).send('Not Found');
            }
          } else {
            res.status(404).send('Not Found');
          }
        } catch (err) {
          res.status(401).send('Unauthorized');
        }
      } else {
        res.status(401).send('Unauthorized');
      }
    })
  } catch (err) {
    res.status(400).send('Bad Request');
  }
});

module.exports = router;
