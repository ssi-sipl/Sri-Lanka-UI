import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/cameras - List all cameras
export async function GET() {
  try {
    const cameras = await prisma.camera.findMany({
      include: {
        _count: {
          select: { rules: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    console.log("to figure out consideration of webcam", cameras);
    return NextResponse.json({ success: true, data: cameras });
  } catch (error: any) {
    console.error("[API] GET /api/cameras error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/cameras - Create a new camera
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, rtspUrl, location, isActive } = body;

    if (!name || !rtspUrl) {
      return NextResponse.json(
        { success: false, error: "Name and RTSP URL are required" },
        { status: 400 }
      );
    }

    // Check if camera with this RTSP URL already exists
    const existing = await prisma.camera.findFirst({
      where: { rtspUrl }
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "A camera with this RTSP URL is already registered" },
        { status: 400 }
      );
    }

    const camera = await prisma.camera.create({
      data: {
        name,
        rtspUrl,
        location: location || null,
        isActive: isActive !== undefined ? isActive : true
      }
    });

    return NextResponse.json({ success: true, data: camera }, { status: 201 });
  } catch (error: any) {
    console.error("[API] POST /api/cameras error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH /api/cameras - Update a camera (usually needs ID in body or query, let's accept body with ID)
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, name, rtspUrl, location, isActive } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Camera ID is required" }, { status: 400 });
    }

    const data: any = {};
    if (name !== undefined) data.name = name;
    if (rtspUrl !== undefined) data.rtspUrl = rtspUrl;
    if (location !== undefined) data.location = location;
    if (isActive !== undefined) data.isActive = isActive;

    const camera = await prisma.camera.update({
      where: { id },
      data
    });

    return NextResponse.json({ success: true, data: camera });
  } catch (error: any) {
    console.error("[API] PATCH /api/cameras error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/cameras - Delete a camera
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Camera ID is required" }, { status: 400 });
    }

    await prisma.camera.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, data: { id } });
  } catch (error: any) {
    console.error("[API] DELETE /api/cameras error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
