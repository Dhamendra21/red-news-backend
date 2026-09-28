const express = require("express")
const router = express.Router()
const News = require("../models/News.model")
const multer = require("multer")
const { uploadImage } = require("../services/ftpService")

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024, files: 5 }
})

router.post("/", upload.array('images', 5), async (req, res) => {
    try {
        const { title, summary, content, readerName, readerEmail } = req.body;
        const images = [];
        if (req.files?.length) {
            for (const file of req.files) {
                const result = await uploadImage(file.buffer, file.originalname, 'reader-news');
                images.push({ url: result.url, fileId: result.fileId });
            }
        }
        const news = await News.create({
            title, summary, content,
            category:"reader-news",
            isReaderSubmitted:true,
            readerName, readerEmail,
            images, 
            status:"draft",
            author: "000000000000000000000"
        })
        res.status(201).json({
            success : true,
            message: "Your news has been created successfully and sent for review",
            data:{id:news._id}
        })
    } catch (error) {
        res.status(400).json({
            success:false,
            error:error.message
        })
    }
})

module.exports = express.Router