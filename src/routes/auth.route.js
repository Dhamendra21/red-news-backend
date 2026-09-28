const express = require('express');
const router = express.Router();
const { register, login, getMe, saveFMCToken } = require('../controllers/authController');


router.post('/register', register);
router.post('/login', login);
router.get('/me', getMe);
router.post('/save-token', saveFMCToken);

module.exports = router;