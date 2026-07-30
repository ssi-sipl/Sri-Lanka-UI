"use client";

import React, { useState, useEffect } from "react";
import { useMqttContext } from "@/providers/MqttProvider";
import {
  Network,
  Activity,
  Trash2,
  Volume2,
  VolumeX,
  RefreshCw,
  Save,
  CheckCircle2,
  AlertTriangle,
  Server,
  Radio,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";

interface DatabaseStats {
  alertsCount: number;
  camerasCount: number;
  peopleCount: number;
  rulesCount: number;
}

export default function SettingsPage() {
  const {
    mqttStatus,
    stats,
    isSoundEnabled,
    setIsSoundEnabled,
    triggerReconnect,
    clearDatabase,
  } = useMqttContext();

  const [mqttUrl, setMqttUrl] = useState("mqtt://localhost:1883");
  const [syncUrl, setSyncUrl] = useState("http://localhost:8766");

  const [dbStats, setDbStats] = useState<DatabaseStats>({
    alertsCount: 0,
    camerasCount: 0,
    peopleCount: 0,
    rulesCount: 0,
  });

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const loadDbStats = async () => {
    try {
      const camerasRes = await fetch("/api/cameras");
      const camerasJson = await camerasRes.json();

      const peopleRes = await fetch("/api/people");
      const peopleJson = await peopleRes.json();

      const rulesRes = await fetch("/api/rules");
      const rulesJson = await rulesRes.json();

      setDbStats({
        alertsCount: stats.totalAlerts,
        camerasCount: camerasJson.success ? camerasJson.data.length : 0,
        peopleCount: peopleJson.success ? peopleJson.data.length : 0,
        rulesCount: rulesJson.success ? rulesJson.data.length : 0,
      });
    } catch (e) {
      console.warn("Failed to load db metrics.");
    }
  };

  useEffect(() => {
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
      setSuccess("Configurations updated successfully!");
    } catch (e) {
      setError("Failed to save settings locally.");
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    if (
      !confirm(
        "Are you sure you want to clear the logs history database? This action is permanent!"
      )
    )
      return;
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
    setSuccess("Reconnection request dispatched to SSE stream.");
  };

  return (
    <div className="nebula-wrapper">
      {/* Nebula Top Spotlight Light Source */}
      <div className="nebula-spotlight"></div>

      <div className="nebula-container">
        {/* Header */}
        <div className="nebula-header">
          <span className="nebula-badge">SYSTEM PREFERENCES</span>
          <h1>Portal Settings</h1>
          <p>
            Configure system network brokers, live stream telemetry, and system actions.
          </p>
        </div>

        {/* Banners */}
        {error && (
          <div className="nebula-banner banner-error">
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="nebula-banner banner-success">
            <CheckCircle2 size={16} />
            <span>{success}</span>
          </div>
        )}

        {/* Cards Grid */}
        <div className="nebula-grid">
          {/* Left Card: Network Config */}
          <div className="nebula-card span-7">
            <div className="nebula-card-header">
              <div className="nebula-icon-wrap">
                <Network size={20} />
              </div>
              <div>
                <h2>Network Configuration</h2>
                <p>Daemon broker links and python REST endpoints.</p>
              </div>
            </div>

            <form onSubmit={handleSaveSettings} className="nebula-form">
              <div className="nebula-input-group">
                <label>
                  <Server size={13} /> MQTT BROKER TCP URL
                </label>
                <input
                  type="text"
                  value={mqttUrl}
                  onChange={(e) => setMqttUrl(e.target.value)}
                  placeholder="mqtt://localhost:1883"
                  className="nebula-input"
                  required
                />
              </div>

              <div className="nebula-input-group">
                <label>
                  <Radio size={13} /> PYTHON REST SYNC SERVER URL
                </label>
                <input
                  type="text"
                  value={syncUrl}
                  onChange={(e) => setSyncUrl(e.target.value)}
                  placeholder="http://localhost:8766"
                  className="nebula-input"
                  required
                />
              </div>

              <button
                type="submit"
                className="nebula-pill-btn btn-primary"
                disabled={saving}
              >
                <span>{saving ? "Saving..." : "Save Configuration"}</span>
                <ArrowRight size={15} />
              </button>
            </form>
          </div>

          {/* Right Card: Telemetry & Stats */}
          <div className="nebula-card span-5">
            <div className="nebula-card-header">
              <div className="nebula-icon-wrap">
                <Activity size={20} />
              </div>
              <div>
                <h2>Broker Diagnostics</h2>
                <p>Live stream telemetry and cached metrics.</p>
              </div>
            </div>

            <div className="nebula-stats-list">
              <div className="nebula-stat-item">
                <span className="stat-label">SSE STREAM STATUS</span>
                <span className={`status-pill ${mqttStatus}`}>
                  <span className="status-dot"></span>
                  {mqttStatus.toUpperCase()}
                </span>
              </div>

              <div className="nebula-stat-item">
                <span className="stat-label">AUDIO FEEDBACK</span>
                <span className="stat-value">
                  {isSoundEnabled ? "ENABLED" : "MUTED"}
                </span>
              </div>

              <div className="nebula-stat-item">
                <span className="stat-label">REGISTERED STREAMS</span>
                <span className="stat-value">{dbStats.camerasCount} STREAMS</span>
              </div>

              <div className="nebula-stat-item">
                <span className="stat-label">RULE POLICIES</span>
                <span className="stat-value">{dbStats.rulesCount} ACTIVE</span>
              </div>

              <div className="nebula-stat-item">
                <span className="stat-label">ALERT RECORDS</span>
                <span className="stat-value">{dbStats.alertsCount} LOGS</span>
              </div>
            </div>

            <div className="nebula-actions-row">
              <button
                onClick={() => setIsSoundEnabled(!isSoundEnabled)}
                className="nebula-pill-btn btn-secondary"
              >
                {isSoundEnabled ? <VolumeX size={15} /> : <Volume2 size={15} />}
                <span>{isSoundEnabled ? "Mute Sound" : "Unmute Sound"}</span>
              </button>

              <button
                onClick={handleManualReconnect}
                className="nebula-pill-btn btn-secondary"
              >
                <RefreshCw size={15} />
                <span>Reconnect</span>
              </button>
            </div>
          </div>

          {/* Danger Zone Full Span */}
          <div className="nebula-card span-12 danger-card">
            <div className="nebula-danger-row">
              <div className="danger-text">
                <div className="danger-header">
                  <ShieldAlert size={20} className="danger-icon" />
                  <h2>System Maintenance</h2>
                </div>
                <p>
                  Irreversibly purge all stored detection logs and telemetry history.
                </p>
              </div>

              <button onClick={handleClear} className="nebula-pill-btn btn-danger">
                <Trash2 size={16} />
                <span>Purge Database Logs</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}