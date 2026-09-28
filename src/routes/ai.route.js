// routes/ai.js
const express = require('express');
const router = express.Router();
const { rewrite, fixGrammarSpelling, generateSEO, translate  } = require('../controllers/aiController');
const { protect, authorize } = require('../middleware/auth.middleware');

router.post('/rewrite', protect, authorize('admin', 'editor', 'reporter'), rewrite);
router.post('/fix-grammar', protect, authorize('admin', 'editor', 'reporter'), fixGrammarSpelling);
router.post('/generate-seo', protect, authorize('admin', 'editor', 'reporter'), generateSEO);
router.post('/translate', translate); // Public - readers can translate

module.exports = router;
