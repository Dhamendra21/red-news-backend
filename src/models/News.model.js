const mongoose = require('mongoose');
const slugify = require('slugify');

const NewsSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true, maxlength: 500 },
  slug:        { type: String, unique: true },
  summary:     { type: String, required: true, maxlength: 500 },
  content:     { type: String, required: true },
  category: {
    type: String,
    required: true,
    enum: [
    'trending', 'international', 'world', 'local', 'sports',
    'science', 'environment', 'reader-news', 'politics',
    'entertainment', 'technology', 'health', 'business',
    'education', 'lifestyle', 'travel', 'food', 'opinion',
    'national', 'state', 'crime'
  ]
  },
  tags:   [{ type: String }],
  images: [{
    url:     { type: String },
    fileId:  { type: String },
    caption: { type: String },
    isMain:  { type: Boolean, default: false }
  }],
  videoUrl:    { type: String, trim: true },
  hasVideo:    { type: Boolean, default: false },
  author:     { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
  authorName: { type: String },

  // SEO
  metaTitle:       { type: String, maxlength: 70 },
  metaDescription: { type: String, maxlength: 160 },
  metaKeywords:    [{ type: String }],

  // Status
  status:    { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
  isTrending:  { type: Boolean, default: false },
  isFeatured:  { type: Boolean, default: false },
  isBreaking:  { type: Boolean, default: false },
  isReaderSubmitted: { type: Boolean, default: false },

  // Stats — सब में default: 0
  views:         { type: Number, default: 0 },
  likes:         { type: Number, default: 0 },
  comments:      { type: Number, default: 0 },
  shares:        { type: Number, default: 0 },
  trendingScore: { type: Number, default: 0 },

  notificationSent: { type: Boolean, default: false },
  publishedAt:      { type: Date },
}, { timestamps: true });

// ── Slug Generation ───────────────────────────────────────
NewsSchema.pre('save', async function(next) {
  // publishedAt set करें
  if (this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }

  // Slug सिर्फ तब बनाएं जब title change हो या slug नहीं है
  if (!this.isModified('title') && this.slug) return next();

  try {
    // Hindi title से slug बनाएं
    let baseSlug = slugify(this.title, {
      lower: true,
      strict: false,
      locale: 'hi',
      trim: true
    });

    // अगर slugify ने कुछ नहीं बनाया (Hindi chars की वजह से)
    if (!baseSlug || baseSlug.length < 3) {
      // Transliteration — Hindi words को Roman में convert करें
      baseSlug = this.title
        .replace(/[^\u0900-\u097F\w\s]/g, '') // Hindi + alphanumeric रखें
        .trim()
        .slice(0, 50)
        .replace(/\s+/g, '-')
        .toLowerCase();
    }

    // अगर अब भी खाली है
    if (!baseSlug || baseSlug.length < 2) {
      baseSlug = `news-${Date.now()}`;
    }

    // Unique slug check
    let slug = baseSlug;
    let count = 0;
    while (true) {
      const existing = await this.constructor.findOne({ slug, _id: { $ne: this._id } });
      if (!existing) break;
      count++;
      slug = `${baseSlug}-${count}`;
    }

    this.slug = slug;
  } catch (err) {
    // Fallback slug
    this.slug = `news-${Date.now()}`;
  }

  next();
});

// ── Trending Score ────────────────────────────────────────
NewsSchema.methods.calculateTrendingScore = function() {
  const views    = Number(this.views)    || 0;
  const likes    = Number(this.likes)    || 0;
  const shares   = Number(this.shares)   || 0;
  const comments = Number(this.comments) || 0;

  const publishedAt = this.publishedAt ? new Date(this.publishedAt) : new Date();
  const hrs = (Date.now() - publishedAt.getTime()) / 3600000;
  const rf = Math.max(0, 48 - hrs) / 48;

  const score = (views * 1 + likes * 3 + shares * 5 + comments * 2) * (1 + rf);
  this.trendingScore = isNaN(score) ? 0 : Math.round(score);
};

// ── Text Search Index ─────────────────────────────────────
NewsSchema.index({ title: 'text', summary: 'text', content: 'text' });
NewsSchema.index({ category: 1, status: 1 });
NewsSchema.index({ trendingScore: -1 });
NewsSchema.index({ publishedAt: -1 });

module.exports = mongoose.model('News', NewsSchema);