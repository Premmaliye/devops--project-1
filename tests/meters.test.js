const request = require('supertest');
const app = require('../src/app');
const store = require('../src/data/store');

describe('Meters API Endpoints', () => {
  beforeEach(() => {
    store.reset();
  });

  describe('GET /api/meters', () => {
    it('should return list of all meters', async () => {
      const res = await request(app).get('/api/meters');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.count).toBe(res.body.data.length);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('GET /api/meters/:id', () => {
    it('should return specific meter by id', async () => {
      const res = await request(app).get('/api/meters/20301');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(20301);
      expect(res.body.data.name).toBe('Main Feeder Meter 1');
    });

    it('should return 404 when meter is not found', async () => {
      const res = await request(app).get('/api/meters/99999');
      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('not found');
    });
  });

  describe('POST /api/meters', () => {
    it('should register a new meter successfully', async () => {
      const newMeter = {
        id: 20303,
        name: 'Solar Inverter Meter 3',
        location: 'Solar Array Zone B',
        status: 'ACTIVE'
      };

      const res = await request(app).post('/api/meters').send(newMeter);
      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(20303);
      expect(res.body.data.name).toBe('Solar Inverter Meter 3');
      expect(res.body.data).toHaveProperty('created_at');

      // Verify it's retrieved via GET
      const verifyRes = await request(app).get('/api/meters/20303');
      expect(verifyRes.statusCode).toBe(200);
      expect(verifyRes.body.data.name).toBe('Solar Inverter Meter 3');
    });

    it('should return 400 if id is missing', async () => {
      const res = await request(app).post('/api/meters').send({
        name: 'No ID Meter'
      });
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 409 if meter already exists', async () => {
      const res = await request(app).post('/api/meters').send({
        id: 20301,
        name: 'Duplicate Meter'
      });
      expect(res.statusCode).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('already exists');
    });
  });
});
