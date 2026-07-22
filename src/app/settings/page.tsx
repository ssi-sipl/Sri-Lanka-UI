"use client";

import React, { useState, useEffect } from "react";
import { useMqttContext } from "@/providers/MqttProvider";

interface DatabaseStats {
  alertsCount: number;
  camerasCount: number;
  peopleCount: number;
  rulesCount: number;
}

export default function SettingsPage() {
  const { mqttStatus, stats, isSoundEnabled, setIsSoundEnabled, triggerReconnect, clearDatabase } = useMqttContext();
  
  // Settings values (cached locally in localStorage)
  const [mqttUrl, setMqttUrl] = useState("mqtt://localhost:1883");
  const [syncUrl, setSyncUrl] = useState("http://localhost:8766");
  
  // Database counts stats
  const [dbStats, setDbStats] = useState<DatabaseStats>({
    alertsCount: 0,
    camerasCount: 0,
    peopleCount: 0,
    rulesCount: 0
  });

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const loadDbStats = async () => {
    try {
      // Load camera count
      const camerasRes = await fetch("/api/cameras");
      const camerasJson = await camerasRes.json();
      
      // Load people count
      const peopleRes = await fetch("/api/people");
      const peopleJson = await peopleRes.json();

      // Load rules count
      const rulesRes = await fetch("/api/rules");
      const rulesJson = await rulesRes.json();

      setDbStats({
        alertsCount: stats.totalAlerts,
        camerasCount: camerasJson.success ? camerasJson.data.length : 0,
        peopleCount: peopleJson.success ? peopleJson.data.length : 0,
        rulesCount: rulesJson.success ? rulesJson.data.length : 0
      });
    } catch (e) {
      console.warn("Failed to load db metrics.");
    }
  };

  useEffect(() => {
    // Read cached configurations on mount
    const savedMqtt = localStorage.getItem("setting_mqtt_url");
    if (savedMqtt) setMqttUrl(savedMqtt);

    const savedSync = localStorage.getItem("setting_sync_url");
    if (savedSync) setSyncUrl(savedSync);

    loadDbStats();
  }, [stats.totalAlerts]);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      localStorage.setItem("setting_mqtt_url", mqttUrl);
      localStorage.setItem("setting_sync_url", syncUrl);
      setSuccess("Configurations updated successfully! Make sure to reload the standalone MQTT daemon if you changed the broker URL.");
    } catch (e) {
      setError("Failed to save settings locally.");
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    if (!confirm("Are you sure you want to clear the logs history database? This action is permanent!")) return;
    try {
      await clearDatabase();
      loadDbStats();
      setSuccess("Logs history database purged successfully.");
    } catch (e) {
      setError("Failed to clear database logs.");
    }
  };

  const handleManualReconnect = () => {
    triggerReconnect();
    setSuccess("Reconnection request dispatched to Server-Sent Events stream.");
  };

  return (
    <div className="settings-page-container flex flex-column gap-md animate-enter">
      {/* Page Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Portal Settings</h1>
          <p className="section-sublabel">Manage communication brokers, audio toggles, and diagnostics.</p>
        </div>
      </div>

      {error && <div className="form-error-banner monospace">⚠️ {error}</div>}
      {success && <div className="form-success-banner monospace">✅ {success}</div>}

      {/* Grid Settings Layout */}
      <div className="settings-grid">
        {/* Left Card: Connection configs */}
        <div className="settings-card bg-glass flex flex-column gap-sm" style={{ padding: "1.25rem" }}>
          <h3 className="font-bold text-cyan" style={{ fontSize: "0.9rem", textTransform: "uppercase" }}>
            Network configuration
          </h3>
          <p className="text-muted" style={{ fontSize: "0.7rem", marginTop: "-0.25rem" }}>
            Define address locations of daemon brokers and python encodings services.
          </p>

          <form onSubmit={handleSaveSettings} className="flex flex-column gap-md" style={{ marginTop: "0.5rem" }}>
            <div className="filter-input-wrap">
              <label className="monospace text-muted" style={{ fontSize: "0.7rem", marginBottom: "0.25rem", display: "block" }}>
                MQTT Broker TCP URL (Daemon subscriber link)
              </label>
              <input
                type="text"
                value={mqttUrl}
                onChange={(e) => setMqttUrl(e.target.value)}
                placeholder="mqtt://localhost:1883"
                className="input-field"
                required
              />
            </div>

            <div className="filter-input-wrap">
              <label className="monospace text-muted" style={{ fontSize: "0.7rem", marginBottom: "0.25rem", display: "block" }}>
                Python REST Sync Server URL
              </label>
              <input
                type="text"
                value={syncUrl}
                onChange={(e) => setSyncUrl(e.target.value)}
                placeholder="http://localhost:8766"
                className="input-field"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={saving} style={{ alignSelf: "flex-end" }}>
              {saving ? "Saving..." : "Save Configuration"}
            </button>
          </form>
        </div>

        {/* Right Card: Diagnostics & Purge Actions */}
        <div className="flex flex-column gap-md">
          {/* Connection diagnostics */}
          <div className="settings-card bg-glass flex flex-column gap-sm" style={{ padding: "1.25rem" }}>
            <h3 className="monospace font-bold text-cyan" style={{ fontSize: "0.9rem", textTransform: "uppercase" }}>
              Broker Diagnostics
            </h3>
            
            <div className="monospace" style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.5rem" }}>
              <div className="diagnostic-row">
                <span className="text-muted">SSE Stream Status:</span>
                <span className={mqttStatus === "connected" ? "text-green font-bold" : mqttStatus === "reconnecting" ? "text-yellow font-bold" : "text-red font-bold"}>
                  {mqttStatus.toUpperCase()}
                </span>
              </div>
              <div className="diagnostic-row">
                <span className="text-muted">Notification Sounds:</span>
                <span>{isSoundEnabled ? "ENABLED" : "MUTED"}</span>
              </div>
              <div className="diagnostic-row">
                <span className="text-muted">Registered Cameras:</span>
                <span>{dbStats.camerasCount} streams</span>
              </div>
              <div className="diagnostic-row">
                <span className="text-muted">Rule Configurations:</span>
                <span>{dbStats.rulesCount} policies</span>
              </div>
              <div className="diagnostic-row" style={{ borderBottom: "none" }}>
                <span className="text-muted">Alert History Count:</span>
                <span>{dbStats.alertsCount} logs</span>
              </div>

              <div className="flex gap-sm justify-between" style={{ marginTop: "0.75rem" }}>
                <button
                  onClick={() => setIsSoundEnabled(!isSoundEnabled)}
                  className="btn border-button"
                  style={{ fontSize: "0.65rem", padding: "0.35rem 0.65rem", flex: 1 }}
                >
                  {isSoundEnabled ? "Mute sound" : "Unmute sound"}
                </button>
                <button
                  onClick={handleManualReconnect}
                  className="btn btn-primary"
                  style={{ fontSize: "0.65rem", padding: "0.35rem 0.65rem", flex: 1 }}
                >
                  Force Reconnect
                </button>
              </div>
            </div>
          </div>

          {/* Database maintenance */}
          <div className="settings-card bg-glass flex flex-column gap-sm" style={{ padding: "1.25rem" }}>
            <h3 className="monospace font-bold text-red" style={{ fontSize: "0.9rem", textTransform: "uppercase" }}>
              System Maintenance
            </h3>
            <p className="monospace text-muted" style={{ fontSize: "0.7rem", marginTop: "-0.25rem" }}>
              Permanent database maintenance actions. Use caution.
            </p>
            
            <button
              onClick={handleClear}
              className="btn border-button hover-bg-red"
              style={{ borderColor: "rgba(255, 42, 95, 0.4)", color: "var(--accent-red)", marginTop: "0.5rem" }}
            >
              Purge Database Logs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
