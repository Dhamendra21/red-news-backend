const express = require('express');
const router = express.Router();
const Advertisement = require('../models/Advertisement');
const { protect, authorize } = require('../middleware/auth.middleware');
const multer = require('multer');

// ── multer initialize ─────────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

// ── imagekit safe load ────────────────────────────────────
let uploadImage = null;
let deleteImage = null;
try {
  const ftpService = require('../services/ftpService');
  const ftpHelper = require('../utils/ftpHelper');
  uploadImage = ftpService.uploadImage;
  deleteImage = async (url) => await ftpHelper.deleteFtpFile(url);
} catch (err) {
  console.warn('⚠️ ftpService not available:', err.message);
}

// ── GET /ads ─────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { position } = req.query;
    const query = { isActive: true };
    if (position) query.position = position;
    query.$or = [{ endDate: { $gte: new Date() } }, { endDate: null }];
    const ads = await Advertisement.find(query);
    if (ads.length > 0) {
      Advertisement.updateMany(
        { _id: { $in: ads.map(a => a._id) } },
        { $inc: { impressions: 1 } }
      ).catch(() => {});
    }
    res.json({ success: true, data: ads });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /ads/all ──────────────────────────────────────────
router.get('/all', protect, authorize('admin'), async (req, res) => {
  try {
    const ads = await Advertisement.find().sort({ createdAt: -1 });
    res.json({ success: true, data: ads });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /ads ─────────────────────────────────────────────
router.post('/', protect, authorize('admin'), upload.single('image'), async (req, res) => {
  try {
    const adData = { ...req.body };

    // ── Boolean parse ─────────────────────────────────
    if (adData.isActive !== undefined)
      adData.isActive = adData.isActive === 'true' || adData.isActive === true;
    if (adData.isGoogleAd !== undefined)
      adData.isGoogleAd = adData.isGoogleAd === 'true' || adData.isGoogleAd === true;

    // ── targetUrl / link दोनों handle करें ───────────
    if (adData.targetUrl && !adData.link) adData.link = adData.targetUrl;
    if (adData.link && !adData.targetUrl) adData.targetUrl = adData.link;

    // ── Default type set करें ─────────────────────────
    if (!adData.type) adData.type = 'banner';

    // ── Image upload ──────────────────────────────────
    if (req.file && uploadImage) {
      const result = await uploadImage(req.file.buffer, req.file.originalname, 'ads');
      adData.imageUrl = result.url;
      adData.fileId   = result.fileId;
    }

    const ad = await Advertisement.create(adData);
    res.status(201).json({ success: true, data: ad });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});
// ── PUT /ads/:id ──────────────────────────────────────────
router.put('/:id', protect, authorize('admin'), upload.single('image'), async (req, res) => {
  try {
    const adData = { ...req.body };
    if (adData.isActive !== undefined) adData.isActive = adData.isActive === 'true' || adData.isActive === true;
    if (req.file && uploadImage) {
      const existing = await Advertisement.findById(req.params.id);
      if (existing?.imageUrl && deleteImage) await deleteImage(existing.imageUrl).catch(() => {});
      const result = await uploadImage(req.file.buffer, req.file.originalname, 'ads');
      adData.imageUrl = result.url;
      adData.fileId = result.fileId;
    }
    const ad = await Advertisement.findByIdAndUpdate(req.params.id, adData, { new: true });
    if (!ad) return res.status(404).json({ success: false, message: 'विज्ञापन नहीं मिला' });
    res.json({ success: true, data: ad });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ── DELETE /ads/:id ───────────────────────────────────────
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const ad = await Advertisement.findByIdAndDelete(req.params.id);
    if (!ad) return res.status(404).json({ success: false, message: 'विज्ञापन नहीं मिला' });
    if (ad?.imageUrl && deleteImage) await deleteImage(ad.imageUrl).catch(() => {});
    res.json({ success: true, message: 'विज्ञापन हटाया गया' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PATCH /ads/:id/click ──────────────────────────────────
router.patch('/:id/click', async (req, res) => {
  try {
    await Advertisement.findByIdAndUpdate(req.params.id, { $inc: { clicks: 1 } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PATCH /ads/:id/toggle ─────────────────────────────────
router.patch('/:id/toggle', protect, authorize('admin'), async (req, res) => {
  try {
    const ad = await Advertisement.findById(req.params.id);
    if (!ad) return res.status(404).json({ success: false, message: 'नहीं मिला' });
    ad.isActive = !ad.isActive;
    await ad.save();
    res.json({ success: true, data: ad });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;