const mongoose = require('mongoose');

const WebStorySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  youtubeUrl: {
    type: String,
    required: true
  },
  thumbnailUrl: {
    type: String,
    required: true
  },
  active: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('WebStory', WebStorySchema);
