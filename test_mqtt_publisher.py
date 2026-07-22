#!/usr/bin/env python3
import time
import json
import random
import datetime
import sys

try:
    import paho.mqtt.client as mqtt
except ImportError:
    print("Error: The 'paho-mqtt' library is required to run this mock publisher.")
    print("Please install it by running:")
    print("  pip install paho-mqtt")
    sys.exit(1)

# List of mock people for recognition
PEOPLE = [
    {"name": "john doe", "base64_face": "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiMwNmI2ZDQiLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjQwIiByPSIyMCIgZmlsbD0iIzBiMGYxOSIvPjxwYXRoIGQ9Ik0yNSA4MGMwLTE1IDEwLTI1IDI1LTI1czI1IDEwIDI1IDI1IiBzdHJva2U9IiMwYjBmMTkiIHN0cm9rZS13aWR0aD0iNCIgZmlsbD0ibm9uZSIvPjwvc3ZnPg=="},
    {"name": "jane smith", "base64_face": "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiM4YjVjZjYiLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjQwIiByPSIyMCIgZmlsbD0iIzBiMGYxOSIvPjxwYXRoIGQ9Ik0yNSA4MGMwLTE1IDEwLTI1IDI1LTI1czI1IDEwIDI1IDI1IiBzdHJva2U9IiMwYjBmMTkiIHN0cm9rZS13aWR0aD0iNCIgZmlsbD0ibm9uZSIvPjwvc3ZnPg=="},
    {"name": "abhinn vyas", "base64_face": "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiMxMGI5ODEiLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjQwIiByPSIyMCIgZmlsbD0iIzBiMGYxOSIvPjxwYXRoIGQ9Ik0yNSA4MGMwLTE1IDEwLTI1IDI1LTI1czI1IDEwIDI1IDI1IiBzdHJva2U9IiMwYjBmMTkiIHN0cm9rZS13aWR0aD0iNCIgZmlsbD0ibm9uZSIvPjwvc3ZnPg=="},
    {"name": "sara connor", "base64_face": "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNlZjQ0NDQiLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjQwIiByPSIyMCIgZmlsbD0iIzBiMGYxOSIvPjxwYXRoIGQ9Ik0yNSA4MGMwLTE1IDEwLTI1IDI1LTI1czI1IDEwIDI1IDI1IiBzdHJva2U9IiMwYjBmMTkiIHN0cm9rZS13aWR0aD0iNCIgZmlsbD0ibm9uZSIvPjwvc3ZnPg=="},
    {"name": "alan turing", "base64_face": "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiMzaDgyZjYiLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjQwIiByPSIyMCIgZmlsbD0iIzBiMGYxOSIvPjxwYXRoIGQ9Ik0yNSA4MGMwLTE1IDEwLTI1IDI1LTI1czI1IDEwIDI1IDI1IiBzdHJva2U9IiMwYjBmMTkiIHN0cm9rZS13aWR0aD0iNCIgZmlsbD0ibm9uZSIvPjwvc3ZnPg=="},
    {"name": "grace hopper", "base64_face": "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNmMTVkOGMiLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjQwIiByPSIyMCIgZmlsbD0iIzBiMGYxOSIvPjxwYXRoIGQ9Ik0yNSA4MGMwLTE1IDEwLTI1IDI1LTI1czI1IDEwIDI1IDI1IiBzdHJva2U9IiMwYjBmMTkiIHN0cm9rZS13aWR0aD0iNCIgZmlsbD0ibm9uZSIvPjwvc3ZnPg=="}
]

CAMERAS = [
    "rtsp://192.168.1.50/stream1",
    "rtsp://192.168.1.62/lobby",
    "rtsp://192.168.1.75/datacenter",
    "rtsp://192.168.1.110/perimeter"
]

MQTT_HOST = "localhost"
MQTT_PORT = 1883
MQTT_TOPIC = "security/alerts"

def main():
    print(f"📡 [MOCK PUBLISHER] Connecting to MQTT Broker at {MQTT_HOST}:{MQTT_PORT}...")
    try:
        from paho.mqtt.enums import CallbackAPIVersion
        client = mqtt.Client(callback_api_version=CallbackAPIVersion.VERSION2)
    except Exception:
        client = mqtt.Client()
        
    try:
        client.connect(MQTT_HOST, MQTT_PORT, 60)
        client.loop_start()
    except Exception as e:
        print(f"❌ Failed to connect to broker: {e}. Ensure MQTT broker is running locally on port 1883.")
        sys.exit(1)
        
    print(f"📡 Mock publisher active. Publishing to topic \"{MQTT_TOPIC}\" every 4-8 seconds...")
    try:
        while True:
            time.sleep(random.uniform(4.0, 8.0))
            
            camera = random.choice(CAMERAS)
            timestamp = datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S.%fZ")
            is_weapon = random.random() < 0.15
            
            if is_weapon:
                weapon = random.choice(["handgun", "knife", "rifle"])
                confidence = round(random.uniform(0.70, 0.98), 2)
                payload = {
                    "type": "weapon_detected",
                    "weapon_type": weapon,
                    "confidence": confidence,
                    "source": camera,
                    "timestamp": timestamp,
                    "weapon_image": f"data:image/svg+xml;base64,{PEOPLE[0]['base64_face']}"
                }
                print(f"Broadcasting WEAPON: {weapon.title()} ({int(confidence*100)}% Confidence) on {camera}")
            else:
                person = random.choice(PEOPLE)
                score = round(random.uniform(0.55, 0.99), 2)
                payload = {
                    "type": "face_detected",
                    "name": person["name"],
                    "score": score,
                    "source": camera,
                    "timestamp": timestamp,
                    "face_image": f"data:image/svg+xml;base64,{person['base64_face']}"
                }
                print(f"Broadcasting FACE: {person['name'].title()} ({int(score*100)}% Match) on {camera}")
                
            client.publish(MQTT_TOPIC, json.dumps(payload))
    except KeyboardInterrupt:
        print("\nStopping mock publisher...")
        client.loop_stop()
        client.disconnect()

if __name__ == "__main__":
    main()
