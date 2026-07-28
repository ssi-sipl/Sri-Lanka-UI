import mqtt from "mqtt";
import { prisma } from "./db";
import { alertEmitter } from "./emitter";

const MQTT_URL = process.env.MQTT_URL || "mqtt://localhost:1883";
const TOPIC = "security/alerts";

declare global {
  var mqttSubscribed: boolean | undefined;
}

export function initMqttSubscriber() {
  if (global.mqttSubscribed) {
    return;
  }
  
  console.log(`[MQTT Background Client] Initializing subscription to MQTT broker...`);
  console.log(`[MQTT Background Client] Connecting to: ${MQTT_URL}`);
  
  const client = mqtt.connect(MQTT_URL);
  
  client.on("connect", () => {
    console.log(`[MQTT Background Client] Connected to MQTT broker successfully!`);
    client.subscribe(TOPIC, (err) => {
      if (err) {
        console.error(`[MQTT Background Client] Subscription to topic "${TOPIC}" failed:`, err);
      } else {
        console.log(`[MQTT Background Client] Subscribed to topic: ${TOPIC}`);
        global.mqttSubscribed = true;
      }
    });
  });
  
  client.on("message", async (topic, message) => {
    try {
      const payload = JSON.parse(message.toString());
      console.log(`[MQTT Background Client] New alert received on topic "${topic}". Type: ${payload.type || 'N/A'}, Source: ${payload.source || 'N/A'}`);
      
      const isWeapon = payload.type === "weapon_detected";
      const name = isWeapon ? (payload.weapon_type || "weapon") : (payload.name || "unknown");
      const score = isWeapon ? (payload.confidence ?? 0.0) : (payload.score ?? 0.0);
      const source = payload.source || "";
      const timestamp = payload.timestamp ? new Date(payload.timestamp) : new Date();
      const faceImage = isWeapon ? (payload.weapon_image || "") : (payload.face_image || "");
      
      if (!source) {
        console.error("[MQTT Background Client] Rejected message: Missing source RTSP stream URL");
        return;
      }
      
      // Resolve category inside SQLite database
      const camera = await prisma.camera.findFirst({
        where: { rtspUrl: source }
      });
      
      let resolvedCategory = "UNKNOWN";
      
      if (isWeapon) {
        resolvedCategory = "WEAPON";
      } else {
        const normalizedName = name.trim().toLowerCase();
        const registeredPerson = await prisma.person.findUnique({
          where: { name: normalizedName }
        });
        
        if (registeredPerson) {
          resolvedCategory = "WHITELIST";
          
          // 1. Try to find per-camera rule
          if (camera) {
            const cameraRule = await prisma.cameraPersonRule.findFirst({
              where: {
                cameraId: camera.id,
                personId: registeredPerson.id
              },
              select: { listType: true }
            });
            if (cameraRule) {
              resolvedCategory = cameraRule.listType;
            }
          }
          
          // 2. Try global rule if camera rule is default
          if (resolvedCategory === "WHITELIST") {
            const globalRule = await prisma.cameraPersonRule.findFirst({
              where: {
                cameraId: null,
                personId: registeredPerson.id
              },
              select: { listType: true }
            });
            if (globalRule) {
              resolvedCategory = globalRule.listType;
            }
          }
        } else {
          resolvedCategory = "UNKNOWN";
        }
      }
      
      // Save Alert to local SQLite database
      const newAlert = await prisma.alert.create({
        data: {
          name: name.toLowerCase(),
          score: parseFloat(score as any),
          source,
          timestamp,
          faceImage,
          category: resolvedCategory,
          acknowledged: false,
          cameraId: camera ? camera.id : null
        },
        include: {
          camera: {
            select: { name: true }
          }
        }
      });
      
      // Broadcast live event to all Server-Sent Events subscribers
      alertEmitter.emit("new-alert", newAlert);
      console.log(`[MQTT Background Client] Alert saved and pushed: ID=${newAlert.id}, Category=${newAlert.category}`);
    } catch (err: any) {
      console.error("[MQTT Background Client] Failed to parse/process message:", err.message);
    }
  });
  
  client.on("error", (err) => {
    console.error("[MQTT Background Client] MQTT client connection error:", err);
  });
  
  client.on("close", () => {
    console.warn("[MQTT Background Client] MQTT connection closed. Reconnecting...");
  });
}
