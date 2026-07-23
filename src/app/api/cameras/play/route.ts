import { NextResponse } from "next/server";
import { exec } from "child_process";

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

    // Use AppleScript to open a new macOS Terminal window, navigate to the folder, run the player, and exit the window on close
    const cmd = `osascript -e 'tell application "Terminal" to do script "cd ${engineDir} && venv/bin/python play_stream.py --url \\"${cleanRtspUrl}\\" --name \\"${windowName}\\" && exit"'`;

    console.log(`📡 [SPAWNER] Executing AppleScript (Clean URL: ${cleanRtspUrl}): ${cmd}`);

    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        console.error("❌ [SPAWNER] AppleScript execution error:", err);
      }
      if (stderr) {
        console.error("⚠️ [SPAWNER] AppleScript stderr:", stderr);
      }
      if (stdout) {
        console.log("📡 [SPAWNER] AppleScript stdout:", stdout.trim());
      }
    });

    return NextResponse.json({ success: true, message: "Native stream window launched successfully" });
  } catch (error: any) {
    console.error("❌ [SPAWNER] Error launching python stream player:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
