const express = require('express')
const router = express.Router()
const News = require('../models/News.model')
const {protect, authorize} = require('../middleware/auth.middleware')
const Comments = require('../models/Comments')

router.get("/:newsId", async (req, res)=>{
    const comments = await Comments.find({news: req.params.newsId, isApproved : true})
    res.status(200).json({
        success:true,
        data:comments
    })
})

router.post('/', async(req,res)=>{
    try {
        const comment =  await Comments.create(req.body);
        return res.status(200).json({
            success: true,
            data:comment,
            message: "comment created successfully"
        })
    } catch (error) {
        res.status(400).json({
            success:false,
            message:error.message
        })
    }
})

router.patch('/:id/approve', protect, authorize('admin', 'editor'), async(req, res)=>{
    const comment  = await Comments.findByIdAndUpdate(req.params.id, {isApproved: true,   }, {new: true})
    res.status(200).json({
        success:true,
        data:comment
    })
})

router.delete("/:id", protect, authorize('admin', "editor"), async (req,res)=>{
        await Comments.findByIdAndDelete(req.params.id);
        res.json({
            success: true,
            message: "comment deleted successfully "
        })
})

module.exports = router

