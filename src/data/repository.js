const db = require('../db/pool');
const memoryStore = require('./store');

class DataRepository {
  async getAllMeters() {
    if (!db.isDbConfigured()) {
      return memoryStore.getAllMeters();
    }
    const res = await db.query('SELECT id, name, location, status, created_at FROM meters ORDER BY id ASC');
    return res.rows;
  }

  async getMeterById(id) {
    if (!db.isDbConfigured()) {
      return memoryStore.getMeterById(id);
    }
    const res = await db.query('SELECT id, name, location, status, created_at FROM meters WHERE id = $1', [id]);
    return res.rows[0] || null;
  }

  async addMeter({ id, name, location = 'Default Site', status = 'ACTIVE' }) {
    if (!db.isDbConfigured()) {
      return memoryStore.addMeter({ id, name, location, status });
    }

    const meterId = Number(id);
    if (!meterId || isNaN(meterId)) {
      throw new Error('Valid numeric meter id is required');
    }

    // Check if meter already exists
    const existing = await this.getMeterById(meterId);
    if (existing) {
      const err = new Error(`Meter with id ${meterId} already exists`);
      err.status = 409;
      throw err;
    }

    const res = await db.query(
      `INSERT INTO meters (id, name, location, status)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, location, status, created_at`,
      [meterId, name || `Meter ${meterId}`, location, status]
    );

    return res.rows[0];
  }

  async addReading(data) {
    if (!db.isDbConfigured()) {
      return memoryStore.addReading(data);
    }

    const meterId = Number(data.meter_id);
    if (!meterId || isNaN(meterId)) {
      throw new Error('Valid meter_id is required');
    }

    const voltage = parseFloat(data.voltage) || 0;
    const current = parseFloat(data.current) || 0;
    const power_kw = data.power_kw !== undefined
      ? parseFloat(data.power_kw)
      : parseFloat(((voltage * current * 1.732 * 0.9) / 1000).toFixed(2));
    const energy_kwh = parseFloat(data.energy_kwh) || 0;
    const timestamp = data.timestamp ? new Date(data.timestamp).toISOString() : new Date().toISOString();

    // Auto-register meter if missing
    let meter = await this.getMeterById(meterId);
    const meterName = data.meter_name || (meter ? meter.name : `Meter ${meterId}`);

    if (!meter) {
      await db.query(
        `INSERT INTO meters (id, name, location, status)
         VALUES ($1, $2, 'Auto-registered from reading', 'ACTIVE')
         ON CONFLICT (id) DO NOTHING`,
        [meterId, meterName]
      );
    }

    const res = await db.query(
      `INSERT INTO readings (meter_id, meter_name, voltage, current, power_kw, energy_kwh, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, meter_id, meter_name, voltage::float, current::float, power_kw::float, energy_kwh::float, timestamp`,
      [meterId, meterName, voltage, current, power_kw, energy_kwh, timestamp]
    );

    return res.rows[0];
  }

  async getReadings(filters = {}) {
    if (!db.isDbConfigured()) {
      return memoryStore.getReadings(filters);
    }

    const conditions = [];
    const values = [];

    if (filters.meter_id) {
      values.push(Number(filters.meter_id));
      conditions.push(`meter_id = $${values.length}`);
    }

    if (filters.start_time) {
      values.push(new Date(filters.start_time).toISOString());
      conditions.push(`timestamp >= $${values.length}`);
    }

    if (filters.end_time) {
      values.push(new Date(filters.end_time).toISOString());
      conditions.push(`timestamp <= $${values.length}`);
    }

    let sql = `
      SELECT id, meter_id, meter_name, voltage::float, current::float, power_kw::float, energy_kwh::float, timestamp
      FROM readings
    `;

    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    sql += ' ORDER BY timestamp DESC';

    if (filters.limit) {
      const limit = parseInt(filters.limit, 10);
      if (!isNaN(limit) && limit > 0) {
        values.push(limit);
        sql += ` LIMIT $${values.length}`;
      }
    }

    const res = await db.query(sql, values);
    return res.rows;
  }

  async getAnalytics() {
    if (!db.isDbConfigured()) {
      return memoryStore.getAnalytics();
    }

    // 1. Overall summary
    const summaryRes = await db.query(`
      SELECT 
        (SELECT COUNT(*)::int FROM meters) AS total_meters,
        COUNT(DISTINCT meter_id)::int AS active_meters,
        COUNT(*)::int AS total_readings,
        COALESCE(ROUND(AVG(power_kw)::numeric, 2)::float, 0) AS average_power_kw,
        COALESCE(ROUND(MAX(power_kw)::numeric, 2)::float, 0) AS peak_power_kw,
        COALESCE(ROUND(AVG(voltage)::numeric, 2)::float, 0) AS average_voltage
      FROM readings
    `);

    // 2. Per-meter breakdown
    const breakdownRes = await db.query(`
      SELECT 
        meter_id,
        COALESCE(MAX(meter_name), 'Meter ' || meter_id) AS meter_name,
        COUNT(*)::int AS readings_count,
        ROUND((MAX(energy_kwh) - MIN(energy_kwh))::numeric, 2)::float AS recorded_consumption_kwh,
        ROUND(AVG(power_kw)::numeric, 2)::float AS average_power_kw,
        ROUND(MAX(power_kw)::numeric, 2)::float AS peak_power_kw,
        MAX(energy_kwh)::float AS latest_reading_kwh,
        MAX(timestamp) AS last_seen
      FROM readings
      GROUP BY meter_id
      ORDER BY meter_id ASC
    `);

    const summary = summaryRes.rows[0] || {
      total_meters: 0,
      active_meters: 0,
      total_readings: 0,
      average_power_kw: 0,
      peak_power_kw: 0,
      average_voltage: 0
    };

    const meters_breakdown = breakdownRes.rows;
    const cumulative_energy_kwh = meters_breakdown.reduce((sum, m) => sum + (m.latest_reading_kwh || 0), 0);
    summary.cumulative_energy_kwh = parseFloat(cumulative_energy_kwh.toFixed(2));

    return {
      summary,
      meters_breakdown
    };
  }
}

module.exports = new DataRepository();
