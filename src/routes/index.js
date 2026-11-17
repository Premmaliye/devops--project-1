const express = require('express');
const router = express.Router();

const infoController = require('../controllers/info.controller');
const meterRoutes = require('./meter.routes');
const readingRoutes = require('./reading.routes');
const analyticsRoutes = require('./analytics.routes');

// Root & Health
router.get('/', infoController.getInfo);
router.get('/health', infoController.getHealth);

// API subroutes
router.use('/api/meters', meterRoutes);
router.use('/api/readings', readingRoutes);
router.use('/api/analytics', analyticsRoutes);

module.exports = router;
