const mqtt = require('mqtt');
const http = require('http');

const MQTT_URL = process.env.MQTT_URL || 'mqtt://localhost:1883';
const NEXT_API_URL = process.env.NEXT_API_URL || 'http://localhost:3000/api/alerts';
const TOPIC = 'security/alerts';

console.log(`[MQTT Subscriber] Starting daemon...`);
console.log(`[MQTT Subscriber] Connecting to MQTT broker at: ${MQTT_URL}`);

const client = mqtt.connect(MQTT_URL);

client.on('connect', () => {
  console.log(`[MQTT Subscriber] Connected to broker successfully!`);
  client.subscribe(TOPIC, (err) => {
    if (err) {
      console.error(`[MQTT Subscriber] Subscription failed:`, err);
    } else {
      console.log(`[MQTT Subscriber] Subscribed to topic: ${TOPIC}`);
    }
  });
});

client.on('message', (topic, message) => {
  try {
    const payload = JSON.parse(message.toString());
    console.log(`[MQTT Subscriber] New alert received on topic "${topic}". Type: ${payload.type || 'N/A'}, Source: ${payload.source || 'N/A'}`);
    
    const postData = JSON.stringify(payload);
    const url = new URL(NEXT_API_URL);
    
    const options = {
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`[MQTT Subscriber] Forwarded to Next.js API (HTTP ${res.statusCode})`);
        } else {
          console.error(`[MQTT Subscriber] Next.js API returned HTTP ${res.statusCode}:`, data);
        }
      });
    });
    
    req.on('error', (e) => {
      console.error(`[MQTT Subscriber] Connection to Next.js API failed:`, e.message);
    });
    
    req.write(postData);
    req.end();
  } catch (error) {
    console.error(`[MQTT Subscriber] Failed to process message:`, error.message);
  }
});

client.on('error', (err) => {
  console.error(`[MQTT Subscriber] MQTT Broker error:`, err);
});

client.on('close', () => {
  console.log(`[MQTT Subscriber] Broker connection closed.`);
});
