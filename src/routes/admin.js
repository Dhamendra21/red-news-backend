// routes/admin.js - Enhanced with full analytics
const express = require('express');
const router = express.Router();
const News = require('../models/News.model');
const Comment = require('../models/Comments');
const User = require('../models/User.model');
const Advertisement = require('../models/Advertisement');
const { protect, authorize } = require('../middleware/auth.middleware');

// Dashboard overview stats
router.get('/stats', protect, authorize('admin', 'editor'), async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart - 7 * 86400000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalNews, publishedNews, draftNews,
      totalComments, pendingComments, totalUsers, totalAds,
      todayNews, weekNews, monthNews,
      recentNews, topNews,
      viewsAgg, likesAgg, sharesAgg
    ] = await Promise.all([
      News.countDocuments(),
      News.countDocuments({ status: 'published' }),
      News.countDocuments({ status: 'draft' }),
      Comment.countDocuments({ isApproved: true }),
      Comment.countDocuments({ isApproved: false }),
      User.countDocuments(),
      Advertisement.countDocuments({ isActive: true }),
      News.countDocuments({ createdAt: { $gte: todayStart }, status: 'published' }),
      News.countDocuments({ createdAt: { $gte: weekStart }, status: 'published' }),
      News.countDocuments({ createdAt: { $gte: monthStart }, status: 'published' }),
      News.find({ status: 'published' }).sort({ createdAt: -1 }).limit(6)
        .select('title status createdAt views likes shares comments category trendingScore'),
      News.find({ status: 'published' }).sort({ views: -1 }).limit(5)
        .select('title views likes shares comments category trendingScore'),
      News.aggregate([{ $group: { _id: null, total: { $sum: '$views' } } }]),
      News.aggregate([{ $group: { _id: null, total: { $sum: '$likes' } } }]),
      News.aggregate([{ $group: { _id: null, total: { $sum: '$shares' } } }]),
    ]);

    res.json({
      success: true,
      data: {
        totalNews, publishedNews, draftNews,
        totalComments, pendingComments, totalUsers, totalAds,
        todayNews, weekNews, monthNews,
        totalViews: viewsAgg[0]?.total || 0,
        totalLikes: likesAgg[0]?.total || 0,
        totalShares: sharesAgg[0]?.total || 0,
        recentNews, topNews
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Views/engagement chart - last N days
router.get('/analytics/views-chart', protect, authorize('admin','editor'), async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 14;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const data = await News.aggregate([
      { $match: { status:'published', createdAt: { $gte: startDate } } },
      { $group: {
        _id: { $dateToString: { format:'%d/%m', date:'$createdAt' } },
        views:     { $sum: '$views' },
        newsCount: { $sum: 1 },
        likes:     { $sum: '$likes' }
      }},
      { $sort: { _id: 1 } },
      { $project: { date:'$_id', views:1, newsCount:1, likes:1, _id:0 } }
    ]);

    // Fill missing dates so Recharts always has a continuous line
    const filledData = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const dateStr = `${day}/${month}`;
      
      const existing = data.find(item => item.date === dateStr);
      filledData.push(existing || { date: dateStr, views: 0, newsCount: 0, likes: 0 });
    }

    res.json({ success:true, data: filledData });
  } catch (err) {
    res.status(500).json({ success:false, message:err.message });
  }
});

// Category-wise stats
router.get('/analytics/category-stats', protect, authorize('admin', 'editor'), async (req, res) => {
  try {
    const data = await News.aggregate([
      { $match: { status: 'published' } },
      {
        $group: {
          _id: '$category',
          totalViews: { $sum: '$views' },
          totalLikes: { $sum: '$likes' },
          totalShares: { $sum: '$shares' },
          totalComments: { $sum: '$comments' },
          newsCount: { $sum: 1 }
        }
      },
      { $sort: { totalViews: -1 } }
    ]);

    const CAT_NAMES = {
      trending: 'ट्रेंडिंग', international: 'अंतर्राष्ट्रीय', national: 'राष्ट्रीय',
      local: 'स्थानीय', sports: 'खेल', science: 'विज्ञान',
      environment: 'पर्यावरण', 'reader-news': 'पाठक समाचार'
    };

    res.json({
      success: true,
      data: data.map(d => ({
        category: d._id, name: CAT_NAMES[d._id] || d._id,
        दृश्य: d.totalViews, पसंद: d.totalLikes, शेयर: d.totalShares,
        खबरें: d.newsCount, टिप्पणियां: d.totalComments
      }))
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Stats ─────────────────────────────────────────────────
router.get('/stats', protect, authorize('admin','editor'), async (req, res) => {
  try {
    const today   = new Date(); today.setHours(0,0,0,0);
    const weekAgo = new Date(Date.now() - 7*24*60*60*1000);

    const [totalNews, todayNews, weekNews, totalUsers, trendingNews, breakingNews, pendingComments, agg] = await Promise.all([
      News.countDocuments({ status:'published' }),
      News.countDocuments({ status:'published', createdAt:{ $gte:today } }),
      News.countDocuments({ status:'published', createdAt:{ $gte:weekAgo } }),
      User.countDocuments(),
      News.countDocuments({ status:'published', isTrending:true }),
      News.countDocuments({ status:'published', isBreaking:true }),
      Comment.countDocuments({ isApproved:false }),
      News.aggregate([{ $group:{ _id:null, totalViews:{ $sum:'$views' }, totalLikes:{ $sum:'$likes' } } }])
    ]);

    res.json({ success:true, data:{
      totalNews, todayNews, weekNews, totalUsers,
      trendingNews, breakingNews, pendingComments,
      totalViews: agg[0]?.totalViews||0,
      totalLikes: agg[0]?.totalLikes||0
    }});
  } catch (err) {
    res.status(500).json({ success:false, message:err.message });
  }
});

// Top performing news
router.get('/analytics/top-news', protect, authorize('admin', 'editor'), async (req, res) => {
  try {
    const { sort = 'views', limit = 10 } = req.query;
    const validSort = ['views', 'likes', 'shares', 'comments', 'trendingScore'].includes(sort) ? sort : 'views';
    const news = await News.find({ status: 'published' })
      .sort({ [validSort]: -1 }).limit(parseInt(limit))
      .select('title category views likes shares comments trendingScore publishedAt slug');
    res.json({ success: true, data: news });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Single news analytics
router.get('/analytics/news/:id', protect, authorize('admin', 'editor'), async (req, res) => {
  try {
    const news = await News.findById(req.params.id)
      .select('title category views likes shares comments trendingScore publishedAt images tags');
    if (!news) return res.status(404).json({ success: false, message: 'नहीं मिला' });

    const engagementRate = news.views > 0
      ? ((news.likes + news.shares + news.comments) / news.views * 100).toFixed(1) : 0;

    const recentComments = await Comment.find({ news: req.params.id, isApproved: true })
      .sort({ createdAt: -1 }).limit(5).select('name comment createdAt');

    res.json({ success: true, data: { ...news.toObject(), engagementRate, recentComments } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// All news with full performance columns
router.get('/news-all', protect, authorize('admin', 'editor'), async (req, res) => {
  try {
    const { page = 1, limit = 20, status, category, sort = 'createdAt' } = req.query;
    const query = {};
    if (status) query.status = status;
    if (category) query.category = category;
    const validSort = ['createdAt','views','likes','shares','trendingScore'].includes(sort) ? sort : 'createdAt';
    const total = await News.countDocuments(query);
    const news = await News.find(query)
      .sort({ [validSort]: -1 })
      .skip((page - 1) * limit).limit(parseInt(limit))
      .select('title category status views likes shares comments trendingScore isBreaking isTrending publishedAt createdAt authorName');
    res.json({ success: true, data: news, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Pending comments
router.get('/pending-comments', protect, authorize('admin', 'editor'), async (req, res) => {
  const comments = await Comment.find({ isApproved: false }).populate('news', 'title slug').sort({ createdAt: -1 });
  res.json({ success: true, data: comments });
});

// Users
router.get('/users', protect, authorize('admin'), async (req, res) => {
  const users = await User.find().select('-password').sort({ createdAt: -1 });
  res.json({ success: true, data: users });
});

router.patch('/users/:id/role', protect, authorize('admin'), async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { role: req.body.role }, { new: true }).select('-password');
  res.json({ success: true, data: user });
});

// Reader submissions
router.get('/reader-submissions', protect, authorize('admin', 'editor'), async (req, res) => {
  const news = await News.find({ isReaderSubmitted: true, status: 'draft' }).sort({ createdAt: -1 });
  res.json({ success: true, data: news });
});

module.exports = router;
