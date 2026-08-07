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
      const isSuspicious = payload.type === "suspicious_activity";
      
      let name = "unknown";
      let score = 0.0;
      let faceImage = "";
      
      if (isWeapon) {
        name = payload.weapon_type || "weapon";
        score = payload.confidence ?? 0.0;
        faceImage = payload.weapon_image || "";
      } else if (isSuspicious) {
        name = payload.activity_type || "suspicious";
        score = payload.confidence ?? 0.0;
        faceImage = payload.suspicious_image || "";
      } else {
        name = payload.name || "unknown";
        score = payload.score ?? 0.0;
        faceImage = payload.face_image || "";
      }
      
      const source = payload.source || "";
      const timestamp = payload.timestamp ? new Date(payload.timestamp) : new Date();
      
      if (!source) {
        console.error("[MQTT Background Client] Rejected message: Missing source RTSP stream URL");
        return;
      }
      
      // Resolve category inside SQLite database
      const camera = await prisma.camera.findFirst({
        where: { rtspUrl: source }
      });
      
      console.log(`[MQTT] Camera lookup for source "${source}": ${camera ? `FOUND → ${camera.name} (${camera.id})` : "NOT FOUND"}`);
      
      let resolvedCategory = "UNKNOWN";
      
      if (isWeapon) {
        resolvedCategory = "WEAPON";
      } else if (isSuspicious) {
        resolvedCategory = "SUSPICIOUS";
      } else {
        const normalizedName = name.trim().toLowerCase();
        const registeredPerson = await prisma.person.findUnique({
          where: { name: normalizedName }
        });
        
        console.log(`[MQTT] Person lookup for "${normalizedName}": ${registeredPerson ? `FOUND → ${registeredPerson.id}` : "NOT FOUND (will be UNKNOWN)"}`);
        
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
              console.log(`[MQTT] Per-camera rule FOUND → ${cameraRule.listType}`);
            } else {
              console.log(`[MQTT] No per-camera rule for this person on this camera`);
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
              console.log(`[MQTT] Global rule FOUND → ${globalRule.listType}`);
            }
          }
        } else {
          resolvedCategory = "UNKNOWN";
        }
      }
      
      console.log(`[MQTT] Final resolved category: ${resolvedCategory}`);
      
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
