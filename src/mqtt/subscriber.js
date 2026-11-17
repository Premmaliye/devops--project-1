const mqtt = require('mqtt');
const repository = require('../data/repository');

let client = null;
let connectionStatus = 'DISCONNECTED';
let lastMessageTimestamp = null;
let totalMessagesReceived = 0;

const TOPIC_TELEMETRY = 'meters/+/telemetry';

const initMqttSubscriber = () => {
  const brokerUrl = process.env.MQTT_BROKER_URL;

  if (!brokerUrl) {
    console.log('ℹ️ MQTT_BROKER_URL not configured. MQTT subscriber disabled.');
    connectionStatus = 'NOT_CONFIGURED';
    return null;
  }

  console.log(`🔌 Connecting to MQTT Broker at ${brokerUrl}...`);
  connectionStatus = 'CONNECTING';

  client = mqtt.connect(brokerUrl, {
    clientId: `energy-monitor-backend-${Math.random().toString(16).substring(2, 8)}`,
    clean: true,
    connectTimeout: 5000,
    reconnectPeriod: 3000
  });

  client.on('connect', () => {
    connectionStatus = 'CONNECTED';
    console.log(`✅ Connected to MQTT broker. Subscribing to topic: ${TOPIC_TELEMETRY}`);
    client.subscribe(TOPIC_TELEMETRY, (err) => {
      if (err) {
        console.error('❌ MQTT Subscription error:', err);
      } else {
        console.log(`📡 Listening for meter telemetry on: ${TOPIC_TELEMETRY}`);
      }
    });
  });

  client.on('message', async (topic, message) => {
    try {
      totalMessagesReceived++;
      lastMessageTimestamp = new Date().toISOString();

      const payload = JSON.parse(message.toString());
      
      // Extract meter_id from topic (meters/{id}/telemetry) if not in payload
      const topicParts = topic.split('/');
      const meterIdFromTopic = topicParts[1];

      const readingData = {
        meter_id: payload.meter_id || Number(meterIdFromTopic),
        meter_name: payload.meter_name,
        voltage: payload.voltage,
        current: payload.current,
        power_kw: payload.power_kw,
        energy_kwh: payload.energy_kwh,
        timestamp: payload.timestamp || new Date().toISOString()
      };

      const savedReading = await repository.addReading(readingData);
      console.log(`📥 [MQTT Ingested] Meter ${savedReading.meter_id}: ${savedReading.power_kw}kW (${savedReading.energy_kwh}kWh) from topic ${topic}`);
    } catch (err) {
      console.error(`❌ Failed to process MQTT message on topic ${topic}:`, err.message);
    }
  });

  client.on('error', (err) => {
    console.error('⚠️ MQTT Client Error:', err.message);
    connectionStatus = 'ERROR';
  });

  client.on('reconnect', () => {
    connectionStatus = 'RECONNECTING';
    console.log('🔄 Reconnecting to MQTT broker...');
  });

  client.on('offline', () => {
    connectionStatus = 'OFFLINE';
  });

  return client;
};

const getStatus = () => {
  return {
    status: connectionStatus,
    broker_url: process.env.MQTT_BROKER_URL || null,
    topic: TOPIC_TELEMETRY,
    total_messages_received: totalMessagesReceived,
    last_message_at: lastMessageTimestamp
  };
};

const stopMqttSubscriber = () => {
  if (client) {
    client.end();
    connectionStatus = 'DISCONNECTED';
  }
};

module.exports = {
  initMqttSubscriber,
  getStatus,
  stopMqttSubscriber
};

