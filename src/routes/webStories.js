const express = require('express');
const router = express.Router();
const { createWebStory, getWebStories, deleteWebStory } = require('../controllers/webStoriesController');

// All stories
router.route('/')
  .get(getWebStories)
  .post(createWebStory);

// Specific story
router.route('/:id')
  .delete(deleteWebStory);

module.exports = router;
