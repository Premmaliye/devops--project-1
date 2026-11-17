/**
 * IoT Smart Meter Simulator (MQTT & HTTP)
 * Simulates smart meters streaming telemetry at a regular interval.
 *
 * Usage:
 *   node scripts/simulate-iot.js                       # Defaults to REST API (http://localhost:3000)
 *   node scripts/simulate-iot.js --mqtt                # Connects via MQTT (mqtt://localhost:1883)
 *   node scripts/simulate-iot.js --mqtt mqtt://broker:1883
 */

const mqtt = require('mqtt');

const isMqttMode = process.argv.includes('--mqtt') || Boolean(process.env.SIMULATE_MQTT);
const MQTT_URL = process.env.MQTT_BROKER_URL || (process.argv[3] && !process.argv[3].startsWith('http') ? process.argv[3] : 'mqtt://localhost:1883');
const API_BASE = process.env.API_BASE_URL || (process.argv[2] && process.argv[2].startsWith('http') ? process.argv[2] : 'http://localhost:3000');
const INTERVAL_MS = parseInt(process.env.SIMULATOR_INTERVAL_MS || '5000', 10);

const simulatedMeters = [
  {
    meter_id: 20301,
    meter_name: 'Energy Meter 1 (Main Feeder)',
    base_voltage: 415,
    base_current: 12.5,
    energy_kwh: 1250.6
  },
  {
    meter_id: 20302,
    meter_name: 'Energy Meter 2 (HVAC Plant)',
    base_voltage: 416,
    base_current: 24.0,
    energy_kwh: 3420.0
  },
  {
    meter_id: 20303,
    meter_name: 'Energy Meter 3 (Solar Inverter)',
    base_voltage: 414,
    base_current: 18.2,
    energy_kwh: 890.4
  }
];

function getRandomJitter(base, maxPercent = 0.04) {
  const delta = (Math.random() * 2 - 1) * maxPercent;
  return parseFloat((base * (1 + delta)).toFixed(2));
}

function generateTelemetry(meter) {
  const voltage = getRandomJitter(meter.base_voltage, 0.02);
  const current = getRandomJitter(meter.base_current, 0.06);

  // Active 3-Phase Power in kW
  const powerFactor = 0.92;
  const power_kw = parseFloat(((voltage * current * 1.732 * powerFactor) / 1000).toFixed(2));

  // Cumulative energy calculation
  const incremental_kwh = parseFloat((power_kw * (INTERVAL_MS / 1000 / 3600)).toFixed(4));
  meter.energy_kwh = parseFloat((meter.energy_kwh + incremental_kwh).toFixed(2));

  return {
    meter_id: meter.meter_id,
    meter_name: meter.meter_name,
    voltage,
    current,
    power_kw,
    energy_kwh: meter.energy_kwh,
    timestamp: new Date().toISOString()
  };
}

async function startMqttSimulation() {
  console.log(`====================================================`);
  console.log(`🔌 Starting IoT Simulator in MQTT Mode`);
  console.log(`   Broker: ${MQTT_URL}`);
  console.log(`   Interval: ${INTERVAL_MS}ms (${INTERVAL_MS / 1000}s)`);
  console.log(`====================================================`);

  const client = mqtt.connect(MQTT_URL);

  client.on('connect', () => {
    console.log('✅ Connected to MQTT broker. Publishing readings...');
    setInterval(() => {
      for (const meter of simulatedMeters) {
        const payload = generateTelemetry(meter);
        const topic = `meters/${meter.meter_id}/telemetry`;
        client.publish(topic, JSON.stringify(payload), { qos: 1 });
        console.log(`📡 [MQTT Published] Topic: ${topic} | ${payload.power_kw}kW | ${payload.energy_kwh}kWh`);
      }
    }, INTERVAL_MS);
  });

  client.on('error', (err) => {
    console.error('❌ MQTT Simulator error:', err.message);
  });
}

async function startHttpSimulation() {
  console.log(`====================================================`);
  console.log(`🔌 Starting IoT Simulator in HTTP REST Mode`);
  console.log(`   Target: ${API_BASE}/api/readings`);
  console.log(`   Interval: ${INTERVAL_MS}ms (${INTERVAL_MS / 1000}s)`);
  console.log(`====================================================`);

  const sendCycle = async () => {
    for (const meter of simulatedMeters) {
      const payload = generateTelemetry(meter);
      try {
        const res = await fetch(`${API_BASE}/api/readings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          console.log(`📡 [HTTP Posted] Meter ${meter.meter_id}: ${payload.power_kw}kW | ${payload.energy_kwh}kWh`);
        }
      } catch (err) {
        console.error(`❌ HTTP error for Meter ${meter.meter_id}:`, err.message);
      }
    }
  };

  sendCycle();
  setInterval(sendCycle, INTERVAL_MS);
}

if (isMqttMode) {
  startMqttSimulation();
} else {
  startHttpSimulation();
}
