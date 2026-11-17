const request = require('supertest');
const app = require('../src/app');

describe('Root & Health Endpoints', () => {
  describe('GET /', () => {
    it('should return application information and endpoint map', async () => {
      const res = await request(app).get('/');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('name', 'Energy Monitor API');
      expect(res.body).toHaveProperty('status', 'running');
      expect(res.body).toHaveProperty('endpoints');
      expect(res.body.endpoints).toHaveProperty('GET /health');
      expect(res.body.endpoints).toHaveProperty('GET /api/meters');
    });
  });

  describe('GET /health', () => {
    it('should return UP status with memory and system checks', async () => {
      const res = await request(app).get('/health');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status', 'UP');
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body).toHaveProperty('uptime_seconds');
      expect(res.body.system).toHaveProperty('node_version');
      expect(res.body.checks).toHaveProperty('database');
      expect(res.body.checks.database).toHaveProperty('status');
    });
  });

  describe('GET /health/mqtt', () => {
    it('should return MQTT broker status', async () => {
      const res = await request(app).get('/health/mqtt');
      expect([200, 503]).toContain(res.statusCode);
      expect(res.body).toHaveProperty('mqtt');
      expect(res.body.mqtt).toHaveProperty('status');
      expect(res.body.mqtt).toHaveProperty('topic', 'meters/+/telemetry');
    });
  });

  describe('404 Not Found Handling', () => {
    it('should return 404 for non-existent route', async () => {
      const res = await request(app).get('/api/non-existent-route');
      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('error');
    });
  });
});

