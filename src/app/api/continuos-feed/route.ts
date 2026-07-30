import { spawn } from "child_process";
import path from "path";
import { processManager } from "@/lib/process_manager";


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
    "verify_continuous.py"
  );

   const manager = processManager.continuousFeed;
  if (manager.process) {
    return Response.json({
      success: false,
      message: "Continuous Detection",
    });
  }

   manager.status = "starting";

  const python = spawn(pythonExe, [pythonFile], {
    cwd: pythonDir,
  });

    manager.process = python;

await new Promise<void>((resolve, reject) => {
    python.stdout.on("data", (data) => {
      const text = data.toString();

      console.log(text);

      if (text.includes("READY")) {
        manager.status = "running";
        resolve();
      }
    });

    python.on("exit", (code) => {
      console.log(`Register Face exited with code ${code}`);

      manager.process = null;
      manager.status = "idle";
    });

    python.on("error", reject);
  });

  python.stderr.on("data", (data) => {
    console.error(data.toString());
  });

  python.on("exit", (code) => {
    console.log(`Register Face existed with code ${code}`);

    manager.process = null;
    manager.status = "idle";
  });

  python.on("error", (err) => {
    console.error(err);
    manager.process = null;
    manager.status = "failed";
  });

  return Response.json({ success: true });
}
