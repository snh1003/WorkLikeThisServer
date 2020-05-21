const express = require('express')
const model = require('../../models/feed.js')
const Feed = model.Feed
const router = express.Router()


router.post('/timeline', async (req, res) => {
        const {userId, interest} = req.body
        const feeds = await Feed.find()
            .where('userId').in([userId, interest])
            .sort('-createAt')
        feeds.pa
        res.status(200).json(feeds)
})
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

router.post('/:id/like', async (req, res) => {
        try{
                const { username } = req.body
                const result = await Feed.findById(req.params.id)

                if(result){
                        result.like.push(username)
                        result.save()
                        console.log(result + result.like)
                        res.status(200).json(result.like)
                }else{
                        res.status(404).json({ error: 'BadRequest' })
                }
        }catch(err){
                console.error(err)
                res.status(400).json({ error: 'BadRequest' })
        }
})
router.get('/all' , async (res, req) => {
        const feeds = await Feed.find({})
        res.status(200).json(feeds)
})
//
// router.post('/:id/unlike')
//
// router.get(/profile)


module.exports = router