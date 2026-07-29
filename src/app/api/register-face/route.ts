import { spawn } from "child_process";
import path from "path";

export async function POST() {
  const pythonDir = path.resolve(process.cwd(), "../Advance-Face-Recognition");

  const pythonExe = path.join(
    pythonDir,
    ".venv",
    "bin",
    "python"
  );

  const pythonFile = path.join(
    pythonDir,
    "capture_faces.py"
  );

  const python = spawn(pythonExe, [pythonFile], {
    cwd: pythonDir,
  });

  python.stderr.on("data", (data) => {
    console.error(data.toString());
  });

  python.on("close", (code) => {
    console.log(`Python exited with code ${code}`);
  });

  return Response.json({ success: true });
}