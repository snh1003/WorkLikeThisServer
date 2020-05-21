const express = require('express')
const model = require('../../models/feed.js')
const Feed = model.Feed
const router = express.Router()


// 타임라인 + 페이징처리
router.post('/timeline', async (req, res) => {
        const {userId, interest} = req.body
        const {page = 1, limit = 10} = req.query
        const skip = (page - 1) * limit
        const feeds = await Feed.find()
            .where('userId').in([userId, interest])
            .sort('-createAt').skip(skip).limit(parseInt(limit));
        res.status(200).json(feeds)
})
//글 작성
router.post('/', async (req, res) => {
                try {
                        const {userId, content} = req.body
                        const storage = new Feed({
                                userId: userId,
                                content: content,
                                like: []
                        })
                        const savedResult = await storage.save()
                        res.status(200).json(savedResult)
                } catch (err) {
                        console.error(err)
                        res.status(400).json({ error: 'BadRequest' })
                }
})
//글 하나의 정보를 objectId로 조회
router.get('/:id', async (req, res) => {
                try {
                        const result = await Feed.findById(req.params.id)
                        if (result) {
                                res.status(200).json(result)
                        } else {
                                res.status(404).json({ error: 'NotFound' })
                        }
                } catch (err) {
                        console.error(err)
                        res.status(400).json({ error: 'BadRequest' })
                }
})
//글 삭제
router.delete('/:id', async (req, res) => {
                try {
                        const result = await Feed.findByIdAndDelete(req.params.id)
                        if (result) {
                                res.status(200).send()
                        } else {
                                res.status(404).json({ error: 'NotFound' })
                        }
                } catch (err) {
                        console.error(err)
                        res.status(400).json({ error: 'BadRequest' })
                }
})
//글 수정
router.patch('/:id', async (req, res) => {
        try{
                const { content } = req.body
                const result = await Feed.findOneAndUpdate({id : req.param.id}, {content : content}, {
                        new: true,
                        returnOriginal: false
                })
                console.log(result)
                if(result) {
                        res.status(200).json(result)
                } else {
                        res.status(404).json({ error : 'BadRequest' })
                }
        }catch(err){
                console.error(err)
                res.status(400).json({ error: 'BadRequest' })

        }
})
// 라이크 추가
router.post('/:id/like', async (req, res) => {
        try{
                const { username } = req.body
                const result = await Feed.findById(req.params.id)

                if(result){
                        result.like.push(username)
                        result.save()
                        res.status(200).json(result.like)
                }else{
                        res.status(404).json({ error: 'BadRequest' })
                }
        }catch(err){
                console.error(err)
                res.status(400).json({ error: 'BadRequest' })
        }
})

//언라이크 처리
router.post('/:id/unlike', async (req, res) => {
        try{
                const { username } = req.body
                const result = await Feed.findById(req.params.id)

                if(result){
                        result.like.pull(username)
                        result.save()
                        res.status(200).json(result.like)
                }else{
                        res.status(404).json({ error: 'BadRequest' })
                }
        }catch(err){
                console.error(err)
                res.status(400).json({ error: 'BadRequest' })
        }
})

// 유저가 작성한 feed 습득
// 인증관련 논의 후 수정->액티브 예정
router.get('/profile', async (req, res) => {
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
})


module.exports = router