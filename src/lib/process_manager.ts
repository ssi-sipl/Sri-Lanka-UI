import { ChildProcess } from "child_process";

type ProcessStatus = "idle" | "starting" | "running" | "failed";

interface ManagedProcess {
  process: ChildProcess | null;
  status: ProcessStatus;
}

export const processManager: Record<string, ManagedProcess> = {
  registerFace: {
    process: null,
    status: "idle",
  },

  multiCamera: {
    process: null,
    status: "idle",
  },

  continuousFeed: {
    process: null,
    status: "idle",
  },

  verifyIdentity: {
    process: null,
    status: "idle",
  },
};