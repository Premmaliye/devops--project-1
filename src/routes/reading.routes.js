const express = require('express');
const router = express.Router();
const readingController = require('../controllers/reading.controller');

router.get('/', readingController.getReadings);
router.post('/', readingController.submitReading);

module.exports = router;

