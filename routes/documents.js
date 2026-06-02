const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const documentController = require('../controllers/documentController');

// Download semester marksheet as PDF
router.get('/marksheet/:semesterId', verifyToken, documentController.downloadMarksheet);

// Download complete academic transcript
router.get('/transcript', verifyToken, documentController.downloadTranscript);

module.exports = router;
