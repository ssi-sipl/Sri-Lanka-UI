# SriLanka — Cognitive Threat Detection Dashboard

A modern, high-performance security dashboard designed for real-time visualization of face matches, blacklist detections, and weapon threat events.

---

## Key Features

1. **Simplified Live Detections Monitor**: Replaced the complex multi-panel UI with a single spacious real-time detection feed on the home dashboard.
2. **Auto-Start Background MQTT Client**: The MQTT subscriber runs **in-process** inside Next.js. No separate subscriber daemon processes are required. It boots automatically when a browser client connects to the dashboard feed.
3. **Unified Proportional Typography**: Monospace fonts are removed globally in favor of a clean, modern, unified Sans-Serif font (`Geist Sans` / `Inter`) across all cards, tables, badges, and metrics.
4. **SQLite Database Integration**: Integrates directly with Prisma SQLite (`dev.db`), which acts as the shared registry for registered cameras and profiles.
5. **CSV Sync Fallback**: Next.js automatically checks local encodings CSV files directly if the Python REST server is offline, ensuring 100% synchronization reliability.

---

## Setup & Running Guide

### 1. Prerequisites
Ensure you have a local MQTT broker installed and running.
```bash
# On macOS
brew install mosquitto
brew services start mosquitto
```

### 2. Installation
Install the project dependencies:
```bash
npm install
```

### 3. Initialize SQLite Database
Make sure the Prisma schema is synchronized with your local `dev.db` SQLite database:
```bash
npx prisma db push
```

### 4. Run the Next.js Server
Start the development server:
```bash
npm run dev
```

### 5. Access the Dashboard
Open **[http://localhost:3000](http://localhost:3000)** in your browser. 
- *Note: Opening the page automatically boots up the internal MQTT subscriber in the background.*
