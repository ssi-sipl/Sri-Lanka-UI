// app/api/process-status/route.ts

import { processManager } from "@/lib/process_manager";

export async function GET() {
  return Response.json({
    registerFace: processManager.registerFace.status,
    multiCamera: processManager.multiCamera.status,
    continuousFeed: processManager.continuousFeed.status,
    verifyIdentity: processManager.verifyIdentity.status,
  });
}

