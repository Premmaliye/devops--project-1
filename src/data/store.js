/**
 * In-memory data store for Phase 1.
 * Provides persistence simulation for meters and energy readings,
 * with query methods and analytical aggregations.
 */

class DataStore {
  constructor() {
    this.reset();
  }

  reset() {
    this.meters = [
      {
        id: 20301,
        name: 'Main Feeder Meter 1',
        location: 'Building A - Substation 1',
        status: 'ACTIVE',
        created_at: '2026-11-17T08:00:00.000Z'
      },
      {
        id: 20302,
        name: 'HVAC Plant Meter 2',
        location: 'Building A - Roof Plant',
        status: 'ACTIVE',
        created_at: '2026-11-17T08:00:00.000Z'
      }
    ];

    this.readings = [
      {
        id: 1,
        meter_id: 20301,
        meter_name: 'Main Feeder Meter 1',
        voltage: 415.0,
        current: 12.5,
        power_kw: 8.5,
        energy_kwh: 1250.6,
        timestamp: '2026-11-17T10:00:00.000Z'
      },
      {
        id: 2,
        meter_id: 20301,
        meter_name: 'Main Feeder Meter 1',
        voltage: 414.2,
        current: 13.1,
        power_kw: 8.9,
        energy_kwh: 1251.2,
        timestamp: '2026-11-17T10:05:00.000Z'
      },
      {
        id: 3,
        meter_id: 20302,
        meter_name: 'HVAC Plant Meter 2',
        voltage: 416.0,
        current: 24.0,
        power_kw: 16.2,
        energy_kwh: 3420.0,
        timestamp: '2026-11-17T10:05:00.000Z'
      }
    ];

    this.nextReadingId = 4;
  }

  // --- Meter Operations ---
  getAllMeters() {
    return [...this.meters];
  }

  getMeterById(id) {
    const numId = Number(id);
    return this.meters.find((m) => m.id === numId) || null;
  }

  addMeter({ id, name, location = 'Default Site', status = 'ACTIVE' }) {
    const meterId = Number(id);
    if (!meterId || isNaN(meterId)) {
      throw new Error('Valid numeric meter id is required');
    }
    if (this.meters.some((m) => m.id === meterId)) {
      const err = new Error(`Meter with id ${meterId} already exists`);
      err.status = 409;
      throw err;
    }

    const newMeter = {
      id: meterId,
      name: name || `Meter ${meterId}`,
      location,
      status,
      created_at: new Date().toISOString()
    };

    this.meters.push(newMeter);
    return newMeter;
  }

  // --- Reading Operations ---
  addReading(data) {
    const meterId = Number(data.meter_id);
    if (!meterId || isNaN(meterId)) {
      throw new Error('Valid meter_id is required');
    }

    const meter = this.getMeterById(meterId);
    const meterName = data.meter_name || (meter ? meter.name : `Meter ${meterId}`);

    const voltage = parseFloat(data.voltage) || 0;
    const current = parseFloat(data.current) || 0;
    // Calculate power if not provided (P = V * I * sqrt(3) * pf / 1000 for 3-phase, or default directly to provided power_kw)
    const power_kw = data.power_kw !== undefined ? parseFloat(data.power_kw) : parseFloat(((voltage * current * 1.732 * 0.9) / 1000).toFixed(2));
    const energy_kwh = parseFloat(data.energy_kwh) || 0;
    const timestamp = data.timestamp ? new Date(data.timestamp).toISOString() : new Date().toISOString();

    const newReading = {
      id: this.nextReadingId++,
      meter_id: meterId,
      meter_name: meterName,
      voltage,
      current,
      power_kw,
      energy_kwh,
      timestamp
    };

    this.readings.push(newReading);

    // Auto-register meter if not yet known
    if (!meter) {
      this.meters.push({
        id: meterId,
        name: meterName,
        location: 'Auto-registered from reading',
        status: 'ACTIVE',
        created_at: new Date().toISOString()
      });
    }

    return newReading;
  }

  getReadings(filters = {}) {
    let result = [...this.readings];

    if (filters.meter_id) {
      const mId = Number(filters.meter_id);
      result = result.filter((r) => r.meter_id === mId);
    }

    if (filters.start_time) {
      const start = new Date(filters.start_time).getTime();
      result = result.filter((r) => new Date(r.timestamp).getTime() >= start);
    }

    if (filters.end_time) {
      const end = new Date(filters.end_time).getTime();
      result = result.filter((r) => new Date(r.timestamp).getTime() <= end);
    }

    // Sort newest first
    result.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    if (filters.limit) {
      const lim = parseInt(filters.limit, 10);
      if (!isNaN(lim) && lim > 0) {
        result = result.slice(0, lim);
      }
    }

    return result;
  }

  // --- Analytics Aggregation ---
  getAnalytics() {
    const totalReadings = this.readings.length;
    const totalMeters = this.meters.length;

    if (totalReadings === 0) {
      return {
        summary: {
          total_meters: totalMeters,
          total_readings: 0,
          total_energy_kwh: 0,
          average_power_kw: 0,
          peak_power_kw: 0,
          average_voltage: 0
        },
        meters_breakdown: []
      };
    }

    let sumPower = 0;
    let sumVoltage = 0;
    let peakPower = 0;

    const meterMap = {};

    for (const r of this.readings) {
      sumPower += r.power_kw;
      sumVoltage += r.voltage;
      if (r.power_kw > peakPower) {
        peakPower = r.power_kw;
      }

      if (!meterMap[r.meter_id]) {
        meterMap[r.meter_id] = {
          meter_id: r.meter_id,
          meter_name: r.meter_name,
          readings_count: 0,
          min_energy_kwh: r.energy_kwh,
          max_energy_kwh: r.energy_kwh,
          latest_energy_kwh: r.energy_kwh,
          total_power_kw: 0,
          peak_power_kw: r.power_kw,
          latest_timestamp: r.timestamp
        };
      }

      const mEntry = meterMap[r.meter_id];
      mEntry.readings_count += 1;
      mEntry.total_power_kw += r.power_kw;
      if (r.power_kw > mEntry.peak_power_kw) mEntry.peak_power_kw = r.power_kw;
      if (r.energy_kwh < mEntry.min_energy_kwh) mEntry.min_energy_kwh = r.energy_kwh;
      if (r.energy_kwh > mEntry.max_energy_kwh) mEntry.max_energy_kwh = r.energy_kwh;

      if (new Date(r.timestamp) >= new Date(mEntry.latest_timestamp)) {
        mEntry.latest_timestamp = r.timestamp;
        mEntry.latest_energy_kwh = r.energy_kwh;
      }
    }

    const meters_breakdown = Object.values(meterMap).map((m) => {
      const consumption_kwh = parseFloat((m.max_energy_kwh - m.min_energy_kwh).toFixed(2));
      const avg_power_kw = parseFloat((m.total_power_kw / m.readings_count).toFixed(2));
      return {
        meter_id: m.meter_id,
        meter_name: m.meter_name,
        readings_count: m.readings_count,
        latest_reading_kwh: m.latest_energy_kwh,
        recorded_consumption_kwh: consumption_kwh,
        average_power_kw: avg_power_kw,
        peak_power_kw: m.peak_power_kw,
        last_seen: m.latest_timestamp
      };
    });

    const totalEnergyKwh = meters_breakdown.reduce((acc, m) => acc + m.latest_reading_kwh, 0);

    return {
      summary: {
        total_meters: totalMeters,
        active_meters: meters_breakdown.length,
        total_readings: totalReadings,
        cumulative_energy_kwh: parseFloat(totalEnergyKwh.toFixed(2)),
        average_power_kw: parseFloat((sumPower / totalReadings).toFixed(2)),
        peak_power_kw: parseFloat(peakPower.toFixed(2)),
        average_voltage: parseFloat((sumVoltage / totalReadings).toFixed(2))
      },
      meters_breakdown
    };
  }
}

// Export singleton instance
module.exports = new DataStore();

