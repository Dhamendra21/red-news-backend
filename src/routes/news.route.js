const express = require('express');
const router = express.Router();
const {
  getNews, getTrending, getNewsBySlug, createNews,
  updateNews, deleteNews, toggleTrending, getBreakingNews
} = require('../controllers/newsController');
const { protect, authorize } = require('../middleware/auth.middleware');

// ── multer setup ──────────────────────────────────────────
let upload = null;
try {
  const multer = require('multer');
  upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024, files: 10 }
  });
} catch (err) {
  console.warn('⚠️ multer not available');
}

const { uploadImage } = require('../services/ftpService');

// ── Image Upload ──────────────────────────────────────────
router.post('/upload-images',
  protect,
  authorize('admin', 'editor', 'reporter'),
  (req, res, next) => {
    if (!upload) return res.status(500).json({ success: false, message: 'multer not configured' });
    upload.array('images', 10)(req, res, next);
  },
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0)
        return res.status(400).json({ success: false, message: 'कोई फ़ाइल नहीं मिली' });
      const results = await Promise.all(
        req.files.map(file => uploadImage(file.buffer, file.originalname, 'news'))
      );
      res.json({ success: true, data: results });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// ── GET routes — order matters! ───────────────────────────
router.get('/trending',    getTrending);
router.get('/breaking',    getBreakingNews);
router.get('/slug/:slug',  getNewsBySlug);   // ← /slug/abc
router.get('/id/:id',      getNewsBySlug);   // ← /id/abc123
router.get('/',            getNews);
router.get('/:slug',       getNewsBySlug);   // ← /abc (fallback)

// ── POST / PUT / DELETE ───────────────────────────────────
router.post('/',              protect, authorize('admin', 'editor', 'reporter'), createNews);
router.put('/:id',            protect, authorize('admin', 'editor'),             updateNews);
router.delete('/:id',         protect, authorize('admin'),                       deleteNews);
router.patch('/:id/trending', protect, authorize('admin', 'editor'),             toggleTrending);

module.exports = router;