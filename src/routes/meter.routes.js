const express = require('express');
const router = express.Router();
const meterController = require('../controllers/meter.controller');

router.get('/', meterController.getMeters);
router.get('/:id', meterController.getMeterById);
router.post('/', meterController.registerMeter);

module.exports = router;
