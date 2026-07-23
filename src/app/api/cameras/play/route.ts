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

    // Format and clean the RTSP URL dynamically before sending to Python script:
    // 1. Strip query parameters (e.g. ?cam=tellers)
    let cleanRtspUrl = rtspUrl.split("?")[0];
    
    // 2. Add back the standard port :554 to the host if it's missing (as python OpenCV requires it)
    const match = cleanRtspUrl.match(/rtsp:\/\/([^/]+)\/(.*)/);
    if (match) {
      const credentialsAndHost = match[1];
      const pathPart = match[2];
      const hostParts = credentialsAndHost.split("@");
      const host = hostParts[hostParts.length - 1];
      if (!host.includes(":")) {
        hostParts[hostParts.length - 1] = `${host}:554`;
        cleanRtspUrl = `rtsp://${hostParts.join("@")}/${pathPart}`;
      }
    }

    const engineDir = "/Users/abhinnvyas/Projects/NotyCircuitsPvtLtd/Advance-Face-Recognition";
    const windowName = name || "Camera View";
    
    const pythonBin = path.join(engineDir, "venv", "bin", "python");
    const scriptPath = path.join(engineDir, "play_stream.py");

    if (!fs.existsSync(pythonBin)) {
      return NextResponse.json(
        { success: false, error: `Python virtualenv binary not found at: ${pythonBin}` },
        { status: 500 }
      );
    }

    console.log(`📡 [SPAWNER] Spawning stream check: ${pythonBin} play_stream.py --url "${cleanRtspUrl}" --name "${windowName}"`);

    // We return a Promise that resolves when the python script outputs its success log,
    // or rejects if it exits with an error code before successfully connecting to the stream.
    return new Promise<NextResponse>((resolve) => {
      let resolved = false;
      let errorOutput = "";

      const child = spawn(
        pythonBin,
        ["-u", scriptPath, "--url", cleanRtspUrl, "--name", windowName],
        {
          cwd: engineDir,
        }
      );

      child.stdout.on("data", (data) => {
        const outputStr = data.toString();
        console.log(`[PLAYER STDOUT] ${outputStr.trim()}`);
        
        // When script prints "Stream active", it means connection succeeded and the window is displayed
        if (outputStr.includes("Stream active")) {
          resolved = true;
          child.unref(); // Detach to let the player window run independently in the background
          resolve(NextResponse.json({ success: true, message: "Stream active and window loaded" }));
        }
      });

      child.stderr.on("data", (data) => {
        const errorStr = data.toString();
        console.error(`[PLAYER STDERR] ${errorStr.trim()}`);
        errorOutput += errorStr;
      });

      child.on("close", (code) => {
        if (!resolved) {
          resolved = true;
          const cleanedErr = errorOutput
            .split("\n")
            .filter(line => line.includes("failed") || line.includes("Error") || line.includes("Could not") || line.includes("Failed"))
            .join(" // ") || "RTSP Stream connection timeout or unreachable.";
            
          resolve(
            NextResponse.json(
              { success: false, error: `Connection failed: ${cleanedErr}` },
              { status: 500 }
            )
          );
        }
      });
    });
  } catch (error: any) {
    console.error("❌ [SPAWNER] Error launching python stream player:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
