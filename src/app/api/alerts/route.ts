import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { alertEmitter } from "@/lib/emitter";

// GET /api/alerts - Get list of alerts with optional filters
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const source = searchParams.get("source");
    const name = searchParams.get("name");
    const acknowledged = searchParams.get("acknowledged");
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const where: any = {};
    if (category) {
      where.category = category;
    }
    if (source) {
      where.source = source;
    }
    if (name) {
      where.name = { contains: name.toLowerCase() };
    }
    if (acknowledged !== null) {
      where.acknowledged = acknowledged === "true";
    }

    const alerts = await prisma.alert.findMany({
      where,
      orderBy: { timestamp: "desc" },
      take: limit,
      skip: offset,
      include: {
        camera: {
          select: { name: true }
        }
      }
    });

    return NextResponse.json({ success: true, data: alerts });
  } catch (error: any) {
    console.error("[API] GET /api/alerts error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/alerts - Handle face/weapon detections, categorize, save, and emit SSE
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Distinguish between face_detected and weapon_detected
    const isWeapon = body.type === "weapon_detected";
    
    // Normalize fields
    const name = isWeapon ? (body.weapon_type || "weapon") : (body.name || "unknown");
    const score = isWeapon ? (body.confidence ?? 0.0) : (body.score ?? 0.0);
    const source = body.source || "";
    const timestamp = body.timestamp ? new Date(body.timestamp) : new Date();
    const faceImage = isWeapon ? (body.weapon_image || "") : (body.face_image || "");

    if (!source) {
      return NextResponse.json(
        { success: false, error: "Missing required source RTSP stream url" },
        { status: 400 }
      );
    }

    // Try to find the camera to link relations
    const camera = await prisma.camera.findUnique({
      where: { rtspUrl: source }
    });

    // Resolve category server-side
    let resolvedCategory = "UNKNOWN";

    if (isWeapon) {
      resolvedCategory = "WEAPON";
    } else {
      const normalizedName = name.trim().toLowerCase();
      
      // Check if person exists in database profiles
      const registeredPerson = await prisma.person.findUnique({
        where: { name: normalizedName }
      });

      if (registeredPerson) {
        // Registered profiles default to whitelisted/safe unless overriden by a rule
        resolvedCategory = "WHITELIST";

        // 1. Try to find per-camera rule
        if (camera) {
          const cameraRule = await prisma.cameraPersonRule.findFirst({
            where: {
              cameraId: camera.id,
              personId: registeredPerson.id
            },
            select: { listType: true }
          });
          if (cameraRule) {
            resolvedCategory = cameraRule.listType;
          }
        }
        
        // 2. Try global rule if camera rule is default
        if (resolvedCategory === "WHITELIST") {
          const globalRule = await prisma.cameraPersonRule.findFirst({
            where: {
              cameraId: null,
              personId: registeredPerson.id
            },
            select: { listType: true }
          });
          if (globalRule) {
            resolvedCategory = globalRule.listType;
          }
        }
      } else {
        // Unregistered profiles are marked as UNKNOWN
        resolvedCategory = "UNKNOWN";
      }
    }

    // Create the alert in SQLite
    const newAlert = await prisma.alert.create({
      data: {
        name: name.toLowerCase(),
        score: parseFloat(score),
        source,
        timestamp,
        faceImage,
        category: resolvedCategory,
        acknowledged: false,
        cameraId: camera ? camera.id : null
      },
      include: {
        camera: {
          select: { name: true }
        }
      }
    });

    // Emit live alert to any active SSE subscribers
    alertEmitter.emit("new-alert", newAlert);

    return NextResponse.json({ success: true, data: newAlert }, { status: 201 });
  } catch (error: any) {
    console.error("[API] POST /api/alerts error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH /api/alerts - Acknowledge alerts (accept ids array or mark all as acknowledged)
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { ids, acknowledged } = body;

    const ackValue = acknowledged !== undefined ? acknowledged : true;

    if (ids && Array.isArray(ids)) {
      await prisma.alert.updateMany({
        where: { id: { in: ids } },
        data: { acknowledged: ackValue }
      });
      return NextResponse.json({ success: true });
    } else {
      await prisma.alert.updateMany({
        where: { acknowledged: !ackValue },
        data: { acknowledged: ackValue }
      });
      return NextResponse.json({ success: true });
    }
  } catch (error: any) {
    console.error("[API] PATCH /api/alerts error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/alerts - Clear alerts history
export async function DELETE() {
  try {
    await prisma.alert.deleteMany({});
    return NextResponse.json({ success: true, message: "All alerts cleared successfully" });
  } catch (error: any) {
    console.error("[API] DELETE /api/alerts error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
