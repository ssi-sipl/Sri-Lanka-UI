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

    const engineDir = "/Users/abhinnvyas/Projects/NotyCircuitsPvtLtd/Advance-Face-Recognition";
    const windowName = name || "Camera View";

    // Use AppleScript to open a new macOS Terminal window, navigate to the folder, run the player, and exit the window on close
    const cmd = `osascript -e 'tell application "Terminal" to do script "cd ${engineDir} && venv/bin/python play_stream.py --url \\"${rtspUrl}\\" --name \\"${windowName}\\" && exit"'`;

    console.log(`📡 [SPAWNER] Executing AppleScript: ${cmd}`);

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
