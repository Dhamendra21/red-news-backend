const mongoose = require('mongoose');

const adSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'विज्ञापन का शीर्षक जरूरी है'],
    trim: true
  },
  type: {
    type: String,
    enum: ['banner', 'sidebar', 'inline', 'popup', 'header', 'footer'],
    required: [true, 'विज्ञापन का प्रकार जरूरी है'],
    default: 'banner'
  },
  position: {
    type: String,
    required: [true, 'विज्ञापन की position जरूरी है'],
    enum: [
      'home-top', 'home-mid', 'home-bottom',
      'sidebar-1', 'sidebar-2',
      'article-top', 'article-mid', 'article-bottom',
      'category-top', 'header', 'footer', 'popup'
    ]
  },
  imageUrl:     { type: String },
  fileId:       { type: String },
  targetUrl:    { type: String },   // ← link की जगह targetUrl
  link:         { type: String },   // backward compatibility
  googleAdCode: { type: String },
  isGoogleAd:   { type: Boolean, default: false },
  isActive:     { type: Boolean, default: true },
  startDate:    { type: Date },
  endDate:      { type: Date },
  impressions:  { type: Number, default: 0 },
  clicks:       { type: Number, default: 0 },
}, { timestamps: true });

// Virtual — targetUrl || link दोनों support करें
adSchema.virtual('url').get(function() {
  return this.targetUrl || this.link || '#';
});

module.exports = mongoose.model('Advertisement', adSchema);