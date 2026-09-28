const News = require('../models/News.model');
const NotificationToken = require('../models/NotificationToken.model');
const { sendNewsNotification } = require('../services/firebase');

const notifyPublishedNews = async (news) => {
    const tokens = await NotificationToken.distinct('token');
    if (!tokens.length) return false;

    const result = await sendNewsNotification(news, tokens);
    if (result.staleTokens.length) {
        await NotificationToken.deleteMany({ token: { $in: result.staleTokens } });
    }
    return result.successCount > 0;
};

// ── Get All News ──────────────────────────────────────────
exports.getNews = async (req, res) => {
    try {
        const { category, page = 1, limit = 10, search, status = "published" } = req.query;
        const query = { status };
        if (category) query.category = category;
        if (search) query.$text = { $search: search };

        const total = await News.countDocuments(query);
        const news = await News.find(query)
            .populate('author', 'name avatar')
            .sort({ publishedAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .select("-content");

        res.status(200).json({
            success: true,
            count: news.length,
            total,
            pages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            data: news
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── Get Trending News ─────────────────────────────────────
exports.getTrending = async (req, res) => {
    try {
        const { limit = 10, page = 1 } = req.query;
        const query = { status: "published" };
        const total = await News.countDocuments(query); // Since we sort by trending score, all published news can be considered, just ordered.
        
        const news = await News.find(query)
            .sort({ trendingScore: -1, publishedAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .select("-content");

        res.status(200).json({ 
            success: true, 
            count: news.length,
            total,
            pages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            data: news 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── Get News By Slug ──────────────────────────────────────
exports.getNewsBySlug = async (req, res) => {
    try {
        const param = req.params.slug || req.params.id;
        const isObjectId = /^[0-9a-fA-F]{24}$/.test(param);

        const news = await News.findOne(
            isObjectId
                ? { _id: param }
                : { slug: param, status: "published" }
        ).populate("author", 'name avatar bio');

        if (!news) return res.status(404).json({
            success: false,
            message: "खबर नहीं मिली"
        });
        // console.log(news);
        
        // ✅ Safe update — validation bypass करें
        await News.findByIdAndUpdate(news._id, {
            $inc: { views: 1 },
            $set: { trendingScore: (() => {
                const v = (news.views + 1) || 0;
                const l = news.likes    || 0;
                const s = news.shares   || 0;
                const c = news.comments || 0;
                const hrs = (Date.now() - new Date(news.publishedAt).getTime()) / 3600000;
                const rf = Math.max(0, 48 - hrs) / 48;
                const score = (v + l*3 + s*5 + c*2) * (1 + rf);
                return isNaN(score) ? 0 : Math.round(score);
            })()}
        });

        res.status(200).json({ success: true, data: news });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
// ── Create News ───────────────────────────────────────────
exports.createNews = async (req, res) => {
    try {
        req.body.author = req.user._id;
        req.body.authorName = req.user.name;
        const news = await News.create(req.body);
        console.log(req.body);
        
        if (news.status === "published") {
            try {
                if (await notifyPublishedNews(news)) {
                    news.notificationSent = true;
                    await news.save();
                }
            } catch (notifErr) {
                console.warn('⚠️ Notification error:', notifErr.message);
            }
        }

        res.status(201).json({ success: true, data: news });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── Update News ───────────────────────────────────────────
exports.updateNews = async (req, res) => {
    try {
        let news = await News.findById(req.params.id);
        if (!news) return res.status(404).json({
            success: false,
            message: "खबर नहीं मिली"
        });

        const wasDraft = news.status !== "published";

        const oldImages = news.images || [];
        const newImages = req.body.images || [];
        const oldUrls = oldImages.map(i => i.url).filter(Boolean);
        const newUrls = newImages.map(i => i.url).filter(Boolean);
        const deletedUrls = oldUrls.filter(url => !newUrls.includes(url));

        news = await News.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });

        // Delete removed images from Hostinger FTP
        if (deletedUrls.length > 0) {
            try {
                const { deleteFtpFile } = require('../utils/ftpHelper');
                for (const url of deletedUrls) {
                    await deleteFtpFile(url);
                }
            } catch (err) {
                console.warn('⚠️ Could not delete images from FTP:', err.message);
            }
        }

        // Send notification if newly published
        if (wasDraft && news.status === 'published' && !news.notificationSent) {
            try {
                if (await notifyPublishedNews(news)) {
                    await News.findByIdAndUpdate(news._id, { notificationSent: true });
                }
            } catch (notifErr) {
                console.warn('⚠️ Notification error:', notifErr.message);
            }
        }

        res.status(200).json({ success: true, data: news });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// ── Delete News ───────────────────────────────────────────
exports.deleteNews = async (req, res) => {
    try {
        const news = await News.findByIdAndDelete(req.params.id);
        if (!news) return res.status(404).json({
            success: false,
            message: "खबर नहीं मिली"
        });

        // Delete all associated images from Hostinger FTP
        if (news.images && news.images.length > 0) {
            try {
                const { deleteFtpFile } = require('../utils/ftpHelper');
                for (const img of news.images) {
                    if (img.url) {
                        await deleteFtpFile(img.url);
                    }
                }
            } catch (err) {
                console.warn('⚠️ Could not delete images from FTP:', err.message);
            }
        }

        res.status(200).json({ success: true, message: "खबर हटाई गई" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── Toggle Trending ───────────────────────────────────────
exports.toggleTrending = async (req, res) => {
    try {
        const news = await News.findById(req.params.id);
        if (!news) return res.status(404).json({
            success: false,
            message: "खबर नहीं मिली"
        });

        news.isTrending = !news.isTrending;
        await news.save();

        res.status(200).json({ success: true, data: news });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── Get Breaking News ─────────────────────────────────────
exports.getBreakingNews = async (req, res) => {
    try {
        const news = await News.find({ status: "published", isBreaking: true })
            .sort({ publishedAt: -1 })
            .limit(5)
            .select("title slug");

        res.status(200).json({ success: true, data: news });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};