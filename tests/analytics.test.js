const request = require('supertest');
const app = require('../src/app');
const store = require('../src/data/store');

describe('Analytics API Endpoints', () => {
  beforeEach(() => {
    store.reset();
  });

  describe('GET /api/analytics', () => {
    it('should return aggregated energy metrics and meters breakdown', async () => {
      const res = await request(app).get('/api/analytics');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body.data).toHaveProperty('summary');

      const { summary, meters_breakdown } = res.body.data;
      expect(summary).toHaveProperty('total_meters');
      expect(summary).toHaveProperty('active_meters');
      expect(summary).toHaveProperty('total_readings');
      expect(summary).toHaveProperty('cumulative_energy_kwh');
      expect(summary).toHaveProperty('average_power_kw');
      expect(summary).toHaveProperty('peak_power_kw');
      expect(summary).toHaveProperty('average_voltage');

      expect(Array.isArray(meters_breakdown)).toBe(true);
      expect(meters_breakdown.length).toBeGreaterThan(0);
      expect(meters_breakdown[0]).toHaveProperty('meter_id');
      expect(meters_breakdown[0]).toHaveProperty('recorded_consumption_kwh');
      expect(meters_breakdown[0]).toHaveProperty('peak_power_kw');
    });
  });
});
