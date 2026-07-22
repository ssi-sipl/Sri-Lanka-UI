import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/rules - List rules, optional filters
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cameraId = searchParams.get("cameraId");
    const personId = searchParams.get("personId");
    const listType = searchParams.get("listType");

    const where: any = {};
    if (cameraId !== null) {
      where.cameraId = cameraId === "null" ? null : cameraId;
    }
    if (personId) {
      where.personId = personId;
    }
    if (listType) {
      where.listType = listType;
    }

    const rules = await prisma.cameraPersonRule.findMany({
      where,
      include: {
        camera: { select: { name: true, rtspUrl: true } },
        person: { select: { name: true } }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ success: true, data: rules });
  } catch (error: any) {
    console.error("[API] GET /api/rules error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/rules - Create or update a rule
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { cameraId, personId, listType } = body;

    if (!personId || !listType) {
      return NextResponse.json(
        { success: false, error: "personId and listType are required" },
        { status: 400 }
      );
    }

    if (listType !== "BLACKLIST" && listType !== "WHITELIST") {
      return NextResponse.json(
        { success: false, error: "listType must be BLACKLIST or WHITELIST" },
        { status: 400 }
      );
    }

    const targetCameraId = cameraId || null;

    // Use findFirst + create/update to safely handle nullable cameraId in SQLite
    const existingRule = await prisma.cameraPersonRule.findFirst({
      where: {
        cameraId: targetCameraId,
        personId: personId
      }
    });

    let rule;
    if (existingRule) {
      rule = await prisma.cameraPersonRule.update({
        where: { id: existingRule.id },
        data: { listType }
      });
    } else {
      rule = await prisma.cameraPersonRule.create({
        data: {
          cameraId: targetCameraId,
          personId,
          listType
        }
      });
    }

    return NextResponse.json({ success: true, data: rule });
  } catch (error: any) {
    console.error("[API] POST /api/rules error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/rules - Delete a rule
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Rule ID is required" }, { status: 400 });
    }

    await prisma.cameraPersonRule.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, data: { id } });
  } catch (error: any) {
    console.error("[API] DELETE /api/rules error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
