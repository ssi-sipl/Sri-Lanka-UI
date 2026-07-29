"use client";

import {
  UserPlus,
  Camera,
  MonitorPlay,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

const actions = [
  {
    title: "Register Face",
    description: "Enroll a new user's face into the system.",
    icon: UserPlus,
    color: "blue-icon",
  },
  {
    title: "Multi-Camera View",
    description: "View multiple camera feeds simultaneously.",
    icon: Camera,
    color: "green-icon",
  },
  {
    title: "Continuous Feed",
    description: "Start continuous live camera monitoring.",
    icon: MonitorPlay,
    color: "orange-icon",
  },
  {
    title: "Verify Identity",
    description: "Capture a photo and verify a person.",
    icon: ShieldCheck,
    color: "purple-icon",
  },
];

export default function CameraConsole() {
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
            onClick={() => console.log(action.title)}
            className={`camera-button ${action.button}`}
          >
            Launch
            <ArrowRight size={18} />
          </button>
        </div>
      );
    })}
  </div>
</div>
  );
}