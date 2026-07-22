"use client";

import React, { useState, useEffect } from "react";
import { useMqttContext } from "@/providers/MqttProvider";
import { AlertCard } from "@/components/AlertCard";

interface Camera {
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
  const [cameras, setCameras] = useState<Camera[]>([]);

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
    if (!confirm("🚨 WARNING: This will permanently delete all stored alert records. Proceed?")) return;
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
      const match = alert.name.toLowerCase().includes(searchName.toLowerCase().trim());
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="alerts-page-container flex flex-column gap-md animate-enter">
      {/* Page Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Audit Alert Feed</h1>
          <p className="section-sublabel">View and categorize incoming detection signals in real-time.</p>
        </div>
        
        <div className="feed-actions-bar">
          <button
            onClick={handleAcknowledgeAll}
            className="btn btn-primary"
            disabled={isAckingAll || alerts.length === 0}
          >
            {isAckingAll ? "Acknowledge..." : "Dismiss All"}
          </button>
          <button
            onClick={handlePurge}
            className="btn border-button hover-bg-red"
            style={{ borderColor: "rgba(255, 42, 95, 0.4)" }}
            disabled={isPurging || alerts.length === 0}
          >
            {isPurging ? "Purging..." : "Clear Logs"}
          </button>
        </div>
      </div>

      {/* Filter panel */}
      <div className="filters-panel bg-glass flex flex-column gap-md">
        <div className="filters-row-main flex justify-between gap-md">
          {/* Category filter pills */}
          <div className="category-filters-group">
            <span className="monospace text-muted" style={{ fontSize: "0.7rem", marginBottom: "0.25rem", display: "block" }}>
              Filter By Classification
            </span>
            <div className="filter-pills">
              <button
                onClick={() => setSelectedCategory("ALL")}
                className={`filter-pill ${selectedCategory === "ALL" ? "active" : ""}`}
              >
                ALL
              </button>
              <button
                onClick={() => setSelectedCategory("BLACKLIST")}
                className={`filter-pill pill-blacklist ${selectedCategory === "BLACKLIST" ? "active" : ""}`}
              >
                BLACKLIST
              </button>
              <button
                onClick={() => setSelectedCategory("WEAPON")}
                className={`filter-pill pill-weapon ${selectedCategory === "WEAPON" ? "active" : ""}`}
              >
                WEAPON
              </button>
              <button
                onClick={() => setSelectedCategory("UNKNOWN")}
                className={`filter-pill pill-unknown ${selectedCategory === "UNKNOWN" ? "active" : ""}`}
              >
                UNKNOWN
              </button>
              <button
                onClick={() => setSelectedCategory("WHITELIST")}
                className={`filter-pill pill-whitelist ${selectedCategory === "WHITELIST" ? "active" : ""}`}
              >
                WHITELIST
              </button>
            </div>
          </div>
        </div>

        <div className="filters-row-secondary flex gap-md">
          {/* Camera selector dropdown */}
          <div className="filter-input-wrap flex-grow-1" style={{ minWidth: "200px" }}>
            <span className="monospace text-muted" style={{ fontSize: "0.7rem", marginBottom: "0.25rem", display: "block" }}>
              Filter By Camera Channel
            </span>
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="select-field"
            >
              <option value="ALL">ALL CAMERAS</option>
              {cameras.map((c) => (
                <option key={c.id} value={c.rtspUrl}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Name search field */}
          <div className="filter-input-wrap flex-grow-2" style={{ minWidth: "250px" }}>
            <span className="monospace text-muted" style={{ fontSize: "0.7rem", marginBottom: "0.25rem", display: "block" }}>
              Search Registered Name
            </span>
            <div className="search-field-container">
              <input
                type="text"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                placeholder="Type profile identity name..."
                className="input-field"
              />
              {searchName && (
                <button
                  onClick={() => setSearchName("")}
                  className="clear-input-btn"
                  title="Clear input"
                >
                  &times;
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Alerts Feed Scroll Area */}
      <div className="alerts-feed-container flex flex-column gap-sm">
        <div className="feed-status-header monospace text-muted">
          <span>
            Showing {filteredAlerts.length} of {alerts.length} events
          </span>
          <span className="text-cyan">
            SSE Connection: {mqttStatus.toUpperCase()}
          </span>
        </div>

        <div className="alerts-feed-scroll scrollable-area">
          {filteredAlerts.length === 0 ? (
            <div className="empty-radar-wrap">
              <h4 className="radar-label text-muted">NO EVENTS MATCH FILTER</h4>
              <p className="radar-sublabel">Change filter classifications or input name terms to inspect stored audits.</p>
            </div>
          ) : (
            <div className="alerts-cards-grid">
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
