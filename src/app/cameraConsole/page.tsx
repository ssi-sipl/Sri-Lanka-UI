"use client";
import { useState, useEffect } from "react";
import {
  UserPlus,
  Camera,
  MonitorPlay,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

const actions = [
  {
    key: "registerFace",
    title: "Register Face",
    description: "Enroll a new user's face into the system.",
    icon: UserPlus,
    color: "blue-icon",
    endpoint: "/api/register-face",
  },
  {
    key: "multiCamera",
    title: "Multi-Camera View",
    description: "View multiple camera feeds simultaneously.",
    icon: Camera,
    color: "green-icon",
    endpoint: "/api/multi-camera-view",
  },
  {
    key: "continuousFeed",
    title: "Continuous Feed",
    description: "Start continuous live camera monitoring.",
    icon: MonitorPlay,
    color: "orange-icon",
    endpoint: "/api/continuos-feed",
  },
  {
    key: "verifyIdentity",
    title: "Verify Identity",
    description: "Capture a photo and verify a person.",
    icon: ShieldCheck,
    color: "purple-icon",
    endpoint: "/api/verify-identity",
  },
];

export default function CameraConsole() {
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch("/api/process-status");
        const data = await res.json(); 

        setStatus({
          "/api/register-face": data.registerFace,
          "/api/multi-camera-view": data.multiCamera,
          "/api/continuos-feed": data.continuousFeed,
          "/api/verify-identity": data.verifyIdentity,
        });
      } catch (err) {
        console.error(err);
      }
    };

    fetchStatus();

    const interval = setInterval(fetchStatus, 1000);

    return () => clearInterval(interval);
  }, []);

  const [status, setStatus] = useState<Record<string, string>>({
    "/api/register-face": "idle",
    "/api/multi-camera-view": "idle",
    "/api/continuos-feed": "idle",
    "/api/verify-identity": "idle",
  });

  const launchAction = async (endpoint: string) => {
    try {
      await fetch(endpoint, {
        method: "POST",
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="camera-console">
      <div className="camera-header">
        <h1>Camera Console</h1>
        <p>Choose a camera operation to perform.</p>
      </div>

      <div className="camera-grid">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <div key={action.title} className="camera-card">
              <div className={`camera-icon ${action.color}`}>
                <Icon size={28} />
              </div>

              <h2>{action.title}</h2>

              <p>{action.description}</p>

              <button
                onClick={() => launchAction(action.endpoint)}
                disabled={
                  status[action.endpoint] === "starting" ||
                  status[action.endpoint] === "running"
                }
                className="camera-button"
              >
                {status[action.endpoint] === "idle" && (
                  <>
                    Launch <ArrowRight size={18} />
                  </>
                )}

                {status[action.endpoint] === "starting" && <>⏳ Starting...</>}

                {status[action.endpoint] === "running" && <>🟢 Running</>}

                {status[action.endpoint] === "failed" && <>🔴 Failed</>}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
