const { rewriteNews, fixGrammar, generateMetaDescription, generateTags, translateContent } = require('../services/gemini');

exports.rewrite = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ success: false, message: 'Content required' });
    const rewritten = await rewriteNews(content);
    res.json({ success: true, data: rewritten });
  } catch (err) {
    res.status(500).json({ success: false, message: 'AI पुनर्लेखन विफल: ' + err.message });
  }
};

exports.fixGrammarSpelling = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ success: false, message: 'Content required' });
    const fixed = await fixGrammar(content);
    res.json({ success: true, data: fixed });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fix grammars ' + err.message });
  }
};

exports.generateSEO = async (req, res) => {
  try {
    const { title, content } = req.body;
    const [metaDescription, tags] = await Promise.all([
      generateMetaDescription(title, content),
      generateTags(title, content)
    ]);
    res.json({ success: true, data: { metaDescription, tags } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to generate SEO : ' + err.message });
  }
};

exports.translate = async (req, res) => {
  try {
    const { content, language } = req.body;
    if (!content || !language) return res.status(400).json({ success: false, message: 'Content and Language is required' });
    const translated = await translateContent(content, language);
    res.json({ success: true, data: translated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to Translate: ' + err.message });
  }
};
