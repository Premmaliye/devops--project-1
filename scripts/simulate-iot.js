/**
 * IoT Smart Meter Simulator
 * Sends simulated meter readings (voltage, current, power, energy) to the REST API.
 * 
 * Usage:
 *   node scripts/simulate-iot.js [TARGET_URL] [INTERVAL_MS]
 * Default target: http://localhost:3000
 * Default interval: 5000 ms (5 seconds)
 */

const API_BASE = process.env.API_BASE_URL || process.argv[2] || 'http://localhost:3000';
const INTERVAL_MS = parseInt(process.env.SIMULATOR_INTERVAL_MS || process.argv[3] || '5000', 10);

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

function getRandomJitter(base, maxPercent = 0.05) {
  const delta = (Math.random() * 2 - 1) * maxPercent;
  return parseFloat((base * (1 + delta)).toFixed(2));
}

async function sendReading(meter) {
  // Add slight random fluctuation
  const voltage = getRandomJitter(meter.base_voltage, 0.03);
  const current = getRandomJitter(meter.base_current, 0.08);

  // 3-Phase power calculation: P(kW) = (V * I * sqrt(3) * pf) / 1000
  const powerFactor = 0.92;
  const power_kw = parseFloat(((voltage * current * 1.732 * powerFactor) / 1000).toFixed(2));

  // Energy increment over interval: kWh = kW * (seconds / 3600)
  const incremental_kwh = parseFloat((power_kw * (INTERVAL_MS / 1000 / 3600)).toFixed(4));
  meter.energy_kwh = parseFloat((meter.energy_kwh + incremental_kwh).toFixed(2));

  const payload = {
    meter_id: meter.meter_id,
    meter_name: meter.meter_name,
    voltage,
    current,
    power_kw,
    energy_kwh: meter.energy_kwh,
    timestamp: new Date().toISOString()
  };

  try {
    const res = await fetch(`${API_BASE}/api/readings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      console.error(`[Meter ${meter.meter_id}] API Error ${res.status}: ${await res.text()}`);
      return;
    }

    const data = await res.json();
    console.log(`📡 [${payload.timestamp}] Meter ${meter.meter_id} sent: ${voltage}V | ${current}A | ${power_kw}kW | Total: ${meter.energy_kwh}kWh`);
  } catch (err) {
    console.error(`[Meter ${meter.meter_id}] Connection error: ${err.message}`);
  }
}

async function runCycle() {
  for (const meter of simulatedMeters) {
    await sendReading(meter);
  }
}

console.log(`====================================================`);
console.log(`🔌 Starting Energy Monitor IoT Simulator`);
console.log(`   Target API: ${API_BASE}`);
console.log(`   Interval: ${INTERVAL_MS}ms (${INTERVAL_MS / 1000}s)`);
console.log(`   Simulating ${simulatedMeters.length} smart meters`);
console.log(`====================================================`);

// Initial burst then recurring
runCycle();
setInterval(runCycle, INTERVAL_MS);

