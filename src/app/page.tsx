"use client";

import React from "react";
import Link from "next/link";
import { useMqttContext } from "@/providers/MqttProvider";
import { BankFloorMap } from "@/components/map/BankFloorMap";
import {
  Activity,
  AlertTriangle,
  ShieldAlert,
  Users,
  CheckCircle2,
  Map,
  ArrowRight,
} from "lucide-react";

export default function DashboardPage() {
  const { stats, unacknowledgedCounts } = useMqttContext();

  return (
    <div className="nebula-wrapper">
      {/* Overhead Spotlight Element (Flush Top) */}
      <div className="nebula-spotlight"></div>

      <div className="nebula-container">
        {/* Header */}
        <div className="nebula-header">
          <span className="nebula-badge">SECURITY COMMAND CENTER</span>
          <h1>Banking Intelligence System</h1>
          <p>
            Real-time threat detection, weapon scoping, and active profile monitor.
          </p>

          <div className="nebula-header-actions">
            <Link href="/alerts" className="nebula-pill-btn btn-primary">
              <span>View Live Feed</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Bento Metrics Grid */}
        <div className="nebula-metrics-grid margin-bottom-lg">
          {/* Total Detections */}
          <div className="nebula-metric-card">
            <div className="metric-header">
              <span className="metric-label">TOTAL DETECTIONS</span>
              <div className="metric-icon-wrap">
                <Activity size={16} />
              </div>
            </div>
            <div className="metric-body">
              <span className="metric-number">{stats.totalAlerts}</span>
              <span className="metric-subtext">All time signals</span>
            </div>
          </div>

          {/* Critical Blacklists */}
          <div className="nebula-metric-card metric-danger">
            <div className="metric-header">
              <span className="metric-label">CRITICAL BLACKLISTS</span>
              <div className="metric-icon-wrap">
                <ShieldAlert size={16} />
              </div>
            </div>
            <div className="metric-body">
              <span className="metric-number">{unacknowledgedCounts.blacklist}</span>
              <span className="metric-subtext">Pending response</span>
            </div>
          </div>

          {/* Weapon Threats */}
          <div className="nebula-metric-card metric-warning">
            <div className="metric-header">
              <span className="metric-label">WEAPON INCIDENTS</span>
              <div className="metric-icon-wrap">
                <AlertTriangle size={16} />
              </div>
            </div>
            <div className="metric-body">
              <span className="metric-number">{unacknowledgedCounts.weapon}</span>
              <span className="metric-subtext">Active detections</span>
            </div>
          </div>

          {/* Unique Faces */}
          <div className="nebula-metric-card">
            <div className="metric-header">
              <span className="metric-label">UNIQUE FACES</span>
              <div className="metric-icon-wrap">
                <Users size={16} />
              </div>
            </div>
            <div className="metric-body">
              <span className="metric-number">{stats.uniquePeopleCount}</span>
              <span className="metric-subtext">Indexed identities</span>
            </div>
          </div>

          {/* Safe Matches */}
          <div className="nebula-metric-card metric-success">
            <div className="metric-header">
              <span className="metric-label">SAFE MATCHES</span>
              <div className="metric-icon-wrap">
                <CheckCircle2 size={16} />
              </div>
            </div>
            <div className="metric-body">
              <span className="metric-number">{unacknowledgedCounts.whitelist}</span>
              <span className="metric-subtext">Whitelisted verified</span>
            </div>
          </div>
        </div>

        {/* Interactive 2D Bank Floor Plan Monitor */}
        <div className="nebula-card">
          <div className="nebula-card-header">
            <div className="nebula-icon-wrap">
              <Map size={20} />
            </div>
            <div>
              <h2>BANK FLOOR MONITOR</h2>
              <p>
                Interactive 2D spatial camera plotting and live security status map.
              </p>
            </div>
          </div>

          <div className="nebula-map-container">
            <BankFloorMap />
          </div>
        </div>
      </div>
    </div>
  );
}