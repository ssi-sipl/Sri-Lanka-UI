"use client";

import React from "react";
import Link from "next/link";
import { useMqttContext } from "@/providers/MqttProvider";
import { AlertCard } from "@/components/AlertCard";

export default function DashboardPage() {
  const { alerts, stats, unacknowledgedCounts } = useMqttContext();

  return (
    <div className="dashboard-container flex flex-column gap-md animate-enter">
      {/* Page Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Cognitive Security Portal</h1>
          <p className="section-sublabel">Real-time threat detection, weapon scoping, and active profile monitor.</p>
        </div>
        <div className="feed-actions-bar">
          <Link href="/alerts" className="btn btn-primary">
            View Live Feed
          </Link>
        </div>
      </div>

      {/* Metrics Belt */}
      <div className="metrics-belt">
        {/* Total Detections */}
        <div className="metric-slot">
          <div className="metric-info">
            <span className="metric-value">{stats.totalAlerts}</span>
            <span className="metric-title">TOTAL DETECTIONS</span>
          </div>
        </div>

        {/* Blacklisted Alerts */}
        <div className="metric-slot">
          <div className="metric-info">
            <span className="metric-value text-red">{unacknowledgedCounts.blacklist}</span>
            <span className="metric-title">CRITICAL BLACKLISTS</span>
          </div>
        </div>

        {/* Weapon Threats */}
        <div className="metric-slot">
          <div className="metric-info">
            <span className="metric-value text-red">{unacknowledgedCounts.weapon}</span>
            <span className="metric-title">WEAPON INCIDENTS</span>
          </div>
        </div>

        {/* Unique Faces */}
        <div className="metric-slot">
          <div className="metric-info">
            <span className="metric-value">{stats.uniquePeopleCount}</span>
            <span className="metric-title">UNIQUE FACES</span>
          </div>
        </div>

        {/* Safe Whitelist */}
        <div className="metric-slot">
          <div className="metric-info">
            <span className="metric-value text-green">{unacknowledgedCounts.whitelist}</span>
            <span className="metric-title">SAFE MATCHES</span>
          </div>
        </div>
      </div>

      {/* Replaced Columns with Single Full-Width Monitor Panel */}
      <div className="dashboard-column gap-sm" style={{ width: "100%", marginTop: "0.5rem" }}>
        <div className="column-header flex justify-between align-center" style={{ borderBottom: "1px solid var(--border-subtle)", paddingBottom: "0.75rem", marginBottom: "1rem" }}>
          <div>
            <h2 className="section-title">Live Detections Monitor</h2>
            <p className="section-sublabel">Real-time stream of incoming face matches and weapon detections.</p>
          </div>
        </div>

        <div className="scrollable-feed scrollable-area" style={{ maxHeight: "calc(100vh - 320px)" }}>
          {alerts.length === 0 ? (
            <div className="empty-radar-wrap" style={{ borderStyle: "dashed", padding: "4rem" }}>
              <div className="radar-scanning-wave"></div>
              <div className="radar-center-dot"></div>
              <h4 className="radar-label text-muted">WAITING FOR INCOMING STREAM DETECTIONS</h4>
              <p className="radar-sublabel">Start the Python verify scripts to push face or weapon feeds.</p>
            </div>
          ) : (
            <div className="alerts-vertical-list">
              {alerts.map((alert, idx) => (
                <AlertCard key={alert.id || idx} alert={alert} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
