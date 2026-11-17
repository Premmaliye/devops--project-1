const request = require('supertest');
const app = require('../src/app');
const store = require('../src/data/store');

describe('Readings API Endpoints', () => {
  beforeEach(() => {
    store.reset();
  });

  describe('GET /api/readings', () => {
    it('should return all meter readings', async () => {
      const res = await request(app).get('/api/readings');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.count).toBe(res.body.data.length);
    });

    it('should filter readings by meter_id', async () => {
      const res = await request(app).get('/api/readings?meter_id=20302');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.every((r) => r.meter_id === 20302)).toBe(true);
    });

    it('should respect the limit query param', async () => {
      const res = await request(app).get('/api/readings?limit=1');
      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBe(1);
    });
  });

  describe('POST /api/readings', () => {
    it('should submit a valid energy reading matching the IoT specification', async () => {
      const sampleReading = {
        meter_id: 20301,
        meter_name: 'Energy Meter 1',
        voltage: 415,
        current: 12.5,
        power_kw: 8.5,
        energy_kwh: 1250.6,
        timestamp: '2026-11-17T10:30:00Z'
      };

      const res = await request(app).post('/api/readings').send(sampleReading);
      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.meter_id).toBe(20301);
      expect(res.body.data.voltage).toBe(415);
      expect(res.body.data.current).toBe(12.5);
      expect(res.body.data.power_kw).toBe(8.5);
      expect(res.body.data.energy_kwh).toBe(1250.6);
      expect(res.body.data).toHaveProperty('id');
    });

    it('should auto-calculate power_kw if omitted', async () => {
      const readingWithoutPower = {
        meter_id: 20301,
        voltage: 400,
        current: 10,
        energy_kwh: 1300
      };

      const res = await request(app).post('/api/readings').send(readingWithoutPower);
      expect(res.statusCode).toBe(201);
      expect(res.body.data.power_kw).toBeGreaterThan(0);
    });

    it('should auto-register new meter if reading comes from unknown meter', async () => {
      const newMeterReading = {
        meter_id: 55555,
        meter_name: 'Brand New Gateway Meter',
        voltage: 230,
        current: 5,
        energy_kwh: 45
      };

      await request(app).post('/api/readings').send(newMeterReading);

      const meterRes = await request(app).get('/api/meters/55555');
      expect(meterRes.statusCode).toBe(200);
      expect(meterRes.body.data.name).toBe('Brand New Gateway Meter');
    });

    it('should reject reading missing required fields', async () => {
      const res = await request(app).post('/api/readings').send({
        voltage: 400
      });
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
