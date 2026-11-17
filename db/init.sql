-- ========================================================
-- Energy Monitor API - PostgreSQL Database Initialization
-- ========================================================

CREATE TABLE IF NOT EXISTS meters (
    id INTEGER PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) DEFAULT 'Default Site',
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS readings (
    id SERIAL PRIMARY KEY,
    meter_id INTEGER NOT NULL REFERENCES meters(id) ON DELETE CASCADE,
    meter_name VARCHAR(255),
    voltage NUMERIC(6, 2) NOT NULL,
    current NUMERIC(6, 2) NOT NULL,
    power_kw NUMERIC(8, 2) NOT NULL,
    energy_kwh NUMERIC(10, 2) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast querying & time-series analysis
CREATE INDEX IF NOT EXISTS idx_readings_meter_id ON readings(meter_id);
CREATE INDEX IF NOT EXISTS idx_readings_timestamp ON readings(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_readings_meter_timestamp ON readings(meter_id, timestamp DESC);

-- Seed initial meters
INSERT INTO meters (id, name, location, status, created_at)
VALUES 
    (20301, 'Main Feeder Meter 1', 'Building A - Substation 1', 'ACTIVE', '2026-11-17 08:00:00+00'),
    (20302, 'HVAC Plant Meter 2', 'Building A - Roof Plant', 'ACTIVE', '2026-11-17 08:00:00+00')
ON CONFLICT (id) DO NOTHING;

-- Seed initial readings
INSERT INTO readings (meter_id, meter_name, voltage, current, power_kw, energy_kwh, timestamp)
VALUES
    (20301, 'Main Feeder Meter 1', 415.0, 12.5, 8.5, 1250.6, '2026-11-17 10:00:00+00'),
    (20301, 'Main Feeder Meter 1', 414.2, 13.1, 8.9, 1251.2, '2026-11-17 10:05:00+00'),
    (20302, 'HVAC Plant Meter 2', 416.0, 24.0, 16.2, 3420.0, '2026-11-17 10:05:00+00')
ON CONFLICT DO NOTHING;
