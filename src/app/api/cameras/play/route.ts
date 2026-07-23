import { NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { rtspUrl, name } = body;

    if (!rtspUrl) {
      return NextResponse.json(
        { success: false, error: "RTSP URL is required" },
        { status: 400 }
      );
    }

    // Absolute path to the python codebase folder
    const engineDir = "/Users/abhinnvyas/Projects/NotyCircuitsPvtLtd/Advance-Face-Recognition";
    
    // Fallback path resolution to find venv binary
    const pythonBin = path.join(engineDir, "venv", "bin", "python");
    const scriptPath = path.join(engineDir, "play_stream.py");

    if (!fs.existsSync(pythonBin)) {
      return NextResponse.json(
        { success: false, error: `Python virtualenv binary not found at: ${pythonBin}` },
        { status: 500 }
      );
    }

    console.log(`📡 [SPAWNER] Spawning live viewer: ${pythonBin} play_stream.py --url "${rtspUrl}" --name "${name || "Camera View"}"`);

    // Spawn the python process asynchronously and detached so it doesn't block Node.js server
    const child = spawn(
      pythonBin,
      [scriptPath, "--url", rtspUrl, "--name", name || "Camera View"],
      {
        cwd: engineDir,
        detached: true,
        stdio: "ignore", // ignore standard I/O to let it run independently
      }
    );

    child.unref(); // prevent parent from waiting for child to exit

    return NextResponse.json({ success: true, message: "Native stream window launched successfully" });
  } catch (error: any) {
    console.error("❌ [SPAWNER] Error launching python stream player:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
