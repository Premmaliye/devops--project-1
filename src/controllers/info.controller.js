const pkg = require('../../package.json');
const db = require('../db/pool');
const mqttSubscriber = require('../mqtt/subscriber');

const getInfo = (req, res) => {
  res.status(200).json({
    name: 'Energy Monitor API',
    description: 'IoT Energy Monitoring REST API for Smart Meters',
    version: pkg.version || '1.0.0',
    status: 'running',
    environment: process.env.NODE_ENV || 'development',
    database_mode: db.isDbConfigured() ? 'PostgreSQL' : 'In-Memory',
    mqtt_broker: process.env.MQTT_BROKER_URL ? 'Connected' : 'Disabled',
    uptime_seconds: Math.floor(process.uptime()),
    endpoints: {
      'GET /': 'Application info',
      'GET /health': 'Application health probe',
      'GET /api/meters': 'Get all registered meters',
      'GET /api/meters/:id': 'Get specific meter by ID',
      'POST /api/meters': 'Register a new meter',
      'GET /api/readings': 'Get readings (filters: meter_id, limit, start_time, end_time)',
      'POST /api/readings': 'Submit new meter reading',
      'GET /api/analytics': 'Get energy consumption summary'
    }
  });
};

const getHealth = async (req, res) => {
  const memoryUsage = process.memoryUsage();
  const dbHealth = await db.checkHealth();
  const mqttStatus = mqttSubscriber.getStatus();
  const isHealthy = dbHealth.status !== 'UNHEALTHY';

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'UP' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    uptime_seconds: Math.floor(process.uptime()),
    system: {
      node_version: process.version,
      memory_mb: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024),
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024)
      }
    },
    checks: {
      database: dbHealth,
      mqtt: mqttStatus
    }
  });
};

module.exports = {
  getInfo,
  getHealth
};
