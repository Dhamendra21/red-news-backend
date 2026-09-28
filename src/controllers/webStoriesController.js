const WebStory = require('../models/WebStory.model');

// Extract YouTube Video ID and generate Thumbnail URL
const extractYouTubeId = (url) => {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:shorts\/|embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  return match && match[1] ? match[1] : null;
};

exports.createWebStory = async (req, res) => {
  try {
    const { title, youtubeUrl } = req.body;
    
    if (!title || !youtubeUrl) {
      return res.status(400).json({ success: false, message: 'Title and YouTube URL are required' });
    }

    const videoId = extractYouTubeId(youtubeUrl);
    if (!videoId) {
      return res.status(400).json({ success: false, message: 'Invalid YouTube URL' });
    }

    const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

    const newStory = await WebStory.create({
      title,
      youtubeUrl,
      thumbnailUrl
    });

    res.status(201).json({ success: true, data: newStory });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getWebStories = async (req, res) => {
  try {
    const stories = await WebStory.find({ active: true }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: stories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteWebStory = async (req, res) => {
  try {
    const story = await WebStory.findByIdAndDelete(req.params.id);
    if (!story) {
      return res.status(404).json({ success: false, message: 'Story not found' });
    }
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
