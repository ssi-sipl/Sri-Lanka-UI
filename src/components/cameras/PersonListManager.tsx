"use client";

import React, { useState, useEffect } from "react";

interface Person {
  id: string;
  name: string;
}

interface Rule {
  id: string;
  cameraId: string | null;
  personId: string;
  listType: string;
  person: {
    name: string;
  };
}

interface PersonListManagerProps {
  cameraId: string;
}

export const PersonListManager: React.FC<PersonListManagerProps> = ({ cameraId }) => {
  const [people, setPeople] = useState<Person[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [selectedPersonId, setSelectedPersonId] = useState("");
  const [listType, setListType] = useState("BLACKLIST");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      // 1. Fetch people registry
      const peopleRes = await fetch("/api/people");
      const peopleJson = await peopleRes.json();
      if (peopleJson.success) {
        setPeople(peopleJson.data);
      }

      // 2. Fetch rules for this camera
      const rulesRes = await fetch(`/api/rules?cameraId=${cameraId}`);
      const rulesJson = await rulesRes.json();
      if (rulesJson.success) {
        setRules(rulesJson.data);
      }
    } catch (e) {
      setError("Failed to query list rules from database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [cameraId]);

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPersonId) return;

    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cameraId,
          personId: selectedPersonId,
          listType
        })
      });

      const json = await res.json();
      if (json.success) {
        setSelectedPersonId("");
        loadData();
      } else {
        setError(json.error || "Failed to add access rule.");
      }
    } catch (e) {
      setError("Server connection failure.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm("Are you sure you want to remove this security rule?")) return;

    try {
      const res = await fetch(`/api/rules?id=${ruleId}`, {
        method: "DELETE"
      });
      const json = await res.json();
      if (json.success) {
        loadData();
      } else {
        setError(json.error || "Failed to delete rule.");
      }
    } catch (e) {
      setError("Server connection failure.");
    }
  };

  const blacklistRules = rules.filter((r) => r.listType === "BLACKLIST");
  const whitelistRules = rules.filter((r) => r.listType === "WHITELIST");

  // Filter out people who already have rules on this camera
  const availablePeople = people.filter(
    (p) => !rules.some((r) => r.personId === p.id)
  );

  if (loading) {
    return (
      <div className="spinner-loader">
        <div className="spinner"></div>
        <p className="monospace text-muted" style={{ fontSize: "0.75rem" }}>Querying active camera policies...</p>
      </div>
    );
  }

  return (
    <div className="person-list-manager flex flex-column gap-md">
      <div className="manager-title-row">
        <h3 className="section-title text-cyan">Access Control Rules</h3>
        <p className="section-sublabel">Define stream specific behaviors. Per-camera settings override global configurations.</p>
      </div>

      {error && (
        <div className="form-error-banner monospace">
          ⚠️ {error}
        </div>
      )}

      {/* Add Rule Form */}
      <form onSubmit={handleAddRule} className="bg-glass p-md flex flex-column gap-sm" style={{ padding: "1.25rem" }}>
        <h4 className="monospace font-bold text-cyan" style={{ fontSize: "0.8rem", textTransform: "uppercase" }}>
          Create Channel Rule
        </h4>
        <div className="flex flex-wrap gap-md align-end" style={{ gap: "1rem" }}>
          <div className="filter-input-wrap flex-grow-1">
            <label className="monospace text-muted" style={{ fontSize: "0.7rem", marginBottom: "0.25rem", display: "block" }}>
              Select Identity Profile
            </label>
            <select
              value={selectedPersonId}
              onChange={(e) => setSelectedPersonId(e.target.value)}
              className="select-field"
              required
            >
              <option value="">-- Choose registered person --</option>
              {availablePeople.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-input-wrap" style={{ minWidth: "150px" }}>
            <label className="monospace text-muted" style={{ fontSize: "0.7rem", marginBottom: "0.25rem", display: "block" }}>
              Access Policy
            </label>
            <select
              value={listType}
              onChange={(e) => setListType(e.target.value)}
              className="select-field"
            >
              <option value="BLACKLIST">BLACKLIST (DENY)</option>
              <option value="WHITELIST">WHITELIST (ALLOW)</option>
            </select>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting || !selectedPersonId}
            style={{ height: "36px" }}
          >
            {submitting ? "Adding..." : "Add Policy Rule"}
          </button>
        </div>
      </form>

      {/* Panes Grid */}
      <div className="manager-panes-grid">
        {/* Blacklist Pane */}
        <div className="manager-pane">
          <div className="pane-header bg-glass border-red" style={{ borderBottom: "1px solid", borderLeft: "3px solid" }}>
            <span className="pane-title text-red font-bold">🔴 Blacklisted Identities ({blacklistRules.length})</span>
          </div>
          <div className="scrollable-pane">
            {blacklistRules.length === 0 ? (
              <p className="monospace text-muted text-center italic" style={{ fontSize: "0.75rem", padding: "1rem 0" }}>
                No active blacklist rules.
              </p>
            ) : (
              <div className="rule-entries-list">
                {blacklistRules.map((rule) => (
                  <div key={rule.id} className="rule-entry-item">
                    <span className="monospace uppercase font-bold text-red">
                      {rule.person.name}
                    </span>
                    <button
                      onClick={() => handleDeleteRule(rule.id)}
                      className="delete-card-btn"
                      title="Remove Rule"
                      aria-label="Remove Rule"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Whitelist Pane */}
        <div className="manager-pane">
          <div className="pane-header bg-glass border-green" style={{ borderBottom: "1px solid", borderLeft: "3px solid" }}>
            <span className="pane-title text-green font-bold">🟢 Whitelisted Identities ({whitelistRules.length})</span>
          </div>
          <div className="scrollable-pane">
            {whitelistRules.length === 0 ? (
              <p className="monospace text-muted text-center italic" style={{ fontSize: "0.75rem", padding: "1rem 0" }}>
                No active whitelist rules.
              </p>
            ) : (
              <div className="rule-entries-list">
                {whitelistRules.map((rule) => (
                  <div key={rule.id} className="rule-entry-item">
                    <span className="monospace uppercase font-bold text-green">
                      {rule.person.name}
                    </span>
                    <button
                      onClick={() => handleDeleteRule(rule.id)}
                      className="delete-card-btn"
                      title="Remove Rule"
                      aria-label="Remove Rule"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
