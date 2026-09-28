const express =require("express")
const User = require("../models/User.model")
const router = express.Router()

const NotificationToken = require("../models/NotificationToken.model");

router.post('/subscribe', async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({ success: false, message: "Token is required" });
        }
        
        // Save or update token
        await NotificationToken.findOneAndUpdate(
            { token },
            { token },
            { upsert: true, new: true }
        );

        res.json({
            success: true,
            message: "Notification Activated"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router
