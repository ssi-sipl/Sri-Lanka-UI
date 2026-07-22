import { NextRequest } from "next/server";
import { alertEmitter } from "@/lib/emitter";
import { initMqttSubscriber } from "@/lib/mqtt_client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // Auto-start background MQTT subscription in-process
  initMqttSubscriber();
  
  let isClosed = false;

  const stream = new ReadableStream({
    start(controller) {
      // Periodic heartbeat to keep connection alive
      const heartbeat = setInterval(() => {
        if (isClosed) return;
        try {
          controller.enqueue(new TextEncoder().encode(": keep-alive\n\n"));
        } catch (e) {
          cleanup();
        }
      }, 15000);

      // Event listener for new alerts
      const onNewAlert = (alert: any) => {
        if (isClosed) return;
        try {
          const payload = JSON.stringify(alert);
          controller.enqueue(new TextEncoder().encode(`data: ${payload}\n\n`));
        } catch (e) {
          cleanup();
        }
      };

      alertEmitter.on("new-alert", onNewAlert);

      const cleanup = () => {
        if (isClosed) return;
        isClosed = true;
        clearInterval(heartbeat);
        alertEmitter.off("new-alert", onNewAlert);
        try {
          controller.close();
        } catch (e) {}
      };

      // Clean up when request is aborted
      req.signal.addEventListener("abort", () => {
        cleanup();
      });
    },
    cancel() {
      isClosed = true;
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no" // Disable buffering on Nginx reverse proxy configurations
    },
  });
}
