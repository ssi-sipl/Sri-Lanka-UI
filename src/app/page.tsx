"use client";

import React from "react";
import Link from "next/link";
import { useMqttContext } from "@/providers/MqttProvider";
import { BankFloorMap } from "@/components/map/BankFloorMap";

export default function DashboardPage() {
  const { stats, unacknowledgedCounts } = useMqttContext();

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

      {/* Interactive 2D Bank Floor Plan Monitor */}
      <div className="dashboard-column gap-sm" style={{ width: "100%", marginTop: "0.5rem" }}>
        <div className="column-header flex justify-between align-center" style={{ borderBottom: "1px solid var(--border-subtle)", paddingBottom: "0.75rem", marginBottom: "1rem" }}>
          <div>
            <h2 className="section-title">BANK FLOOR MONITOR</h2>
            <p className="section-sublabel">Interactive 2D spatial camera plotting and live security status map.</p>
          </div>
        </div>

        <BankFloorMap />
      </div>
    </div>
  );
}
