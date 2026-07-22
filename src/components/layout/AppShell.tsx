"use client";

import React, { useState } from "react";
import { MqttProvider } from "@/providers/MqttProvider";
import { Sidebar } from "./Sidebar";

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <MqttProvider>
      <div className="app-layout">
        {/* Mobile Header Bar */}
        <header className="mobile-nav-header">
          <div className="mobile-brand">
            <div className="brand-logo">
              <span className="logo-square"></span>
              <span className="logo-square secondary"></span>
            </div>
            <h2>Cognitive Gateway</h2>
          </div>
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="hamburger-btn"
            aria-label="Toggle navigation menu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="icon"
              style={{ width: "24px", height: "24px" }}
            >
              {isMobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              )}
            </svg>
          </button>
        </header>

        <div className="main-wrapper">
          <Sidebar mobileOpen={isMobileOpen} onClose={() => setIsMobileOpen(false)} />
          <main className="app-main-content">
            <div className="content-container">{children}</div>
          </main>
        </div>
      </div>
    </MqttProvider>
  );
};
