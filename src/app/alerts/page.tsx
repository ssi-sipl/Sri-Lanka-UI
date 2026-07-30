"use client";

import React, { useState, useEffect } from "react";
import { useMqttContext } from "@/providers/MqttProvider";
import { AlertCard } from "@/components/AlertCard";
import {
  Bell,
  CheckCheck,
  Trash2,
  Filter,
  Search,
  Camera,
  X,
  ShieldAlert,
  Radio,
} from "lucide-react";

interface CameraItem {
  id: string;
  name: string;
  rtspUrl: string;
}

export default function AlertsFeedPage() {
  const { alerts, mqttStatus, acknowledgeAll, clearDatabase } = useMqttContext();

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedSource, setSelectedSource] = useState<string>("ALL");
  const [searchName, setSearchName] = useState<string>("");
  const [cameras, setCameras] = useState<CameraItem[]>([]);

  // Actions states
  const [isAckingAll, setIsAckingAll] = useState(false);
  const [isPurging, setIsPurging] = useState(false);

  // Fetch camera options
  useEffect(() => {
    const fetchCameras = async () => {
      try {
        const res = await fetch("/api/cameras");
        const json = await res.json();
        if (json.success) {
          setCameras(json.data);
        }
      } catch (e) {
        console.error("Failed to load camera options:", e);
      }
    };
    fetchCameras();
  }, []);

  const handleAcknowledgeAll = async () => {
    if (!confirm("Acknowledge all unacknowledged events?")) return;
    setIsAckingAll(true);
    try {
      await acknowledgeAll();
    } finally {
      setIsAckingAll(false);
    }
  };

  const handlePurge = async () => {
    if (
      !confirm(
        "🚨 WARNING: This will permanently delete all stored alert records. Proceed?"
      )
    )
      return;
    setIsPurging(true);
    try {
      await clearDatabase();
    } finally {
      setIsPurging(false);
    }
  };

  // Filter alert list locally
  const filteredAlerts = alerts.filter((alert) => {
    // 1. Filter by category
    if (selectedCategory !== "ALL" && alert.category !== selectedCategory) {
      return false;
    }
    // 2. Filter by camera source
    if (selectedSource !== "ALL" && alert.source !== selectedSource) {
      return false;
    }
    // 3. Filter by search name queries
    if (searchName.trim()) {
      const match = alert.name
        .toLowerCase()
        .includes(searchName.toLowerCase().trim());
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="nebula-wrapper">
      {/* Overhead Spotlight Element (Flush Top) */}
      <div className="nebula-spotlight"></div>

      <div className="nebula-container">
        {/* Header */}
        <div className="nebula-header">
          <span className="nebula-badge">REAL-TIME AUDIT LOGS</span>
          <h1>Audit Alert Feed</h1>
          <p>View and categorize incoming detection signals in real-time.</p>

          <div className="nebula-header-actions gap-sm">
            <button
              onClick={handleAcknowledgeAll}
              className="nebula-pill-btn btn-primary"
              disabled={isAckingAll || alerts.length === 0}
            >
              <CheckCheck size={15} />
              <span>{isAckingAll ? "Dismissing..." : "Dismiss All"}</span>
            </button>

            <button
              onClick={handlePurge}
              className="nebula-pill-btn btn-danger"
              disabled={isPurging || alerts.length === 0}
            >
              <Trash2 size={15} />
              <span>{isPurging ? "Purging..." : "Clear Logs"}</span>
            </button>
          </div>
        </div>

        {/* Filters Card */}
        <div className="nebula-card margin-bottom-lg">
          <div className="nebula-card-header">
            <div className="nebula-icon-wrap">
              <Filter size={20} />
            </div>
            <div>
              <h2>Filter Signals</h2>
              <p>Narrow down detection history by category, stream, or name.</p>
            </div>
          </div>

          <div className="nebula-filters-content">
            {/* Classification Pills Row */}
            <div className="nebula-filter-group">
              <label>CLASSIFICATION</label>
              <div className="nebula-filter-pills">
                {["ALL", "BLACKLIST", "WEAPON", "UNKNOWN", "WHITELIST"].map(
                  (cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`pill-item ${
                        selectedCategory === cat ? "active" : ""
                      } ${cat.toLowerCase()}`}
                    >
                      {cat}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Dropdown and Search Input Row */}
            <div className="nebula-form-row margin-top-md">
              <div className="nebula-input-group flex-1">
                <label>
                  <Camera size={12} /> CAMERA CHANNEL
                </label>
                <select
                  value={selectedSource}
                  onChange={(e) => setSelectedSource(e.target.value)}
                  className="nebula-select"
                >
                  <option value="ALL">ALL CAMERAS</option>
                  {cameras.map((c) => (
                    <option key={c.id} value={c.rtspUrl}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="nebula-input-group flex-2">
                <label>
                  <Search size={12} /> IDENTITY SEARCH
                </label>
                <div className="nebula-input-with-clear">
                  <input
                    type="text"
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                    placeholder="Search profile identity..."
                    className="nebula-input"
                  />
                  {searchName && (
                    <button
                      onClick={() => setSearchName("")}
                      className="clear-btn"
                      title="Clear search"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts Feed Grid Container */}
        <div className="nebula-card">
          <div className="nebula-card-header justify-between flex-wrap gap-md">
            <div className="flex align-center gap-sm">
              <div className="nebula-icon-wrap">
                <Bell size={20} />
              </div>
              <div>
                <h2>Alert Stream History</h2>
                <p>
                  Showing {filteredAlerts.length} of {alerts.length} total events
                </p>
              </div>
            </div>

            <div className="flex align-center gap-xs">
              <Radio size={12} className="text-cyan" />
              <span className={`status-pill ${mqttStatus}`}>
                <span className="status-dot"></span>
                SSE: {mqttStatus.toUpperCase()}
              </span>
            </div>
          </div>

          {filteredAlerts.length === 0 ? (
            <div className="nebula-empty-state">
              <ShieldAlert size={36} className="empty-icon" />
              <h4>NO MATCHING AUDIT SIGNALS</h4>
              <p>
                Adjust filter classifications, camera channels, or clear search queries to view stored detections.
              </p>
            </div>
          ) : (
            <div className="nebula-alerts-grid">
              {filteredAlerts.map((alert, idx) => (
                <AlertCard key={alert.id || idx} alert={alert} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}