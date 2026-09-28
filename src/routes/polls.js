const express = require('express');
const router = express.Router();
const { createPoll, getActivePoll, votePoll, deletePoll } = require('../controllers/pollsController');

router.route('/')
  .get(getActivePoll)
  .post(createPoll);

router.route('/:id/vote')
  .post(votePoll);

router.route('/:id')
  .delete(deletePoll);

module.exports = router;
