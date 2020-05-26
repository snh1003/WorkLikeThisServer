const express = require('express');
const redis = require('redis');
const feedsModel = require('../../models/feed.js');
const hashModel = require('../../models/hashtag');

const client = redis.createClient(6379, 'redis');
const { Feed } = feedsModel;
const { Hash } = hashModel;
const router = express.Router();
// 타임라인 + 페이징처리
router.get('/timeline', async (req, res) => {
  try {
    client.hgetall(req.headers.authorization, async (err, result) => {
      const { page = 1, limit = 10 } = req.query;
      const skip = (page - 1) * limit;
      if (err) {
        res.status(401).send('Unauthorized');
      } else {
        const feeds = await Feed.find()
          .where('hashtag')
          .in([result.hashTag])
          .sort('-createAt')
          .skip(skip)
          .limit(parseInt(limit));
        res.status(200).json(feeds);
      }
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'BadRequest' });
  }
});
// 글 작성
router.post('/', async (req, res) => {
  try {
    client.hgetall(req.headers.authorization, async (err, result) => {
      if (err) {
        res.status(401).send('Unauthorized');
      } else {
        const {
          content, image,
        } = req.body;
        const { username, job } = result;
        const hashtag = await findTag(`${content} `);
        const storage = new Feed({
          username,
          content,
          image,
          job,
          like: [],
          hashtag,
        });
        const savedResult = await storage.save();
        res.status(200).json(savedResult);
      }
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'BadRequest' });
  }
});
// 글 하나의 정보를 objectId로 조회
router.get('/:id', async (req, res) => {
  try {
      const result = await Feed.findById(req.params.id);
      if (result) {
        res.status(200).json(result);
      } else {
        res.status(404).json({ error: 'NotFound' });
      }
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'BadRequest' });
  }
});
// 글 삭제
router.delete('/:id', async (req, res) => {
  try {
    client.hgetall(req.headers.authorization, async (err, result) => {
      if (err) {
        res.status(401).send('Unauthorized');
      } else {
        const result = await Feed.findByIdAndDelete(req.params.id);
        if (result) {
          res.status(200).send();
        } else {
          res.status(404).json({ error: 'NotFound' });
        }
      }
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'BadRequest' });
  }
});
// 글 수정
router.patch('/:id', async (req, res) => {
  try {
    const { content } = req.body;
    const result = await Feed.findOneAndUpdate(
      { id: req.param.id },
      { content },
      {
        new: true,
        returnOriginal: false,
      },
    );
    // console.log(result);
    if (result) {
      res.status(200).json(result);
    } else {
      res.status(404).json({ error: 'BadRequest' });
    }
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'BadRequest' });
  }
});
// 라이크 추가
router.post('/:id/like', async (req, res) => {
  try {
    const { userId } = req.body;
    const result = await Feed.findById(req.params.id);

    if (result) {
      result.like.push(userId);
      result.save();
      res.status(200).json(result.like);
    } else {
      res.status(404).json({ error: 'BadRequest' });
    }
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'BadRequest' });
  }
});

// 언라이크 처리
router.post('/:id/unlike', async (req, res) => {
  try {
    const { username } = req.body;
    const result = await Feed.findById(req.params.id);

    if (result) {
      result.like.pull(username);
      result.save();
      res.status(200).json(result.like);
    } else {
      res.status(404).json({ error: 'BadRequest' });
    }
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'BadRequest' });
  }
});

// 유저가 작성한 feed 습득
// 인증관련 논의 후 수정->액티브 예정
// router.get('/profile', async (req, res) => {
// try {
//         const result = await Feed.findById(req.params.id)
//         if (result) {
//                 res.status(200).json(result)
//         } else {
//                 res.status(404).json({ error: 'NotFound' })
//         }
// } catch (err) {
//         console.error(err)
//         res.status(400).json({ error: 'BadRequest' })
// }
// });


const findTag = (content) => {
  let tagOn = false;
  let storage = '';
  const result = [];
  for (let i = 0; i < content.length; i++) {
    const contentElement = content[i];
    const hashStorage = new Hash();
    if (contentElement === ' ' && storage.length > 0) {
      result.push(storage);
      hashStorage.hashtag = storage;
      hashStorage.save();
      storage = '';
      tagOn = false;
    }
    if (tagOn) storage += contentElement;
    if (contentElement === '#') tagOn = true;
  }
  return result;
};
module.exports = router;
