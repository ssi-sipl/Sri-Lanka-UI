import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/people - List all people in database
export async function GET() {
  try {
    const people = await prisma.person.findMany({
      include: {
        rules: {
          include: {
            camera: {
              select: { name: true }
            }
          }
        }
      },
      orderBy: { name: "asc" }
    });
    return NextResponse.json({ success: true, data: people });
  } catch (error: any) {
    console.error("[API] GET /api/people error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/people - Create a new person (idempotent on name)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, notes } = body;

    if (!name) {
      return NextResponse.json({ success: false, error: "Name is required" }, { status: 400 });
    }

    const normalizedName = name.strip ? name.strip().toLowerCase() : name.trim().toLowerCase();

    // Check if person already exists
    let person = await prisma.person.findUnique({
      where: { name: normalizedName }
    });

    if (!person) {
      person = await prisma.person.create({
        data: {
          name: normalizedName,
          notes: notes || null
        }
      });
    } else if (notes !== undefined) {
      // Update notes if provided
      person = await prisma.person.update({
        where: { id: person.id },
        data: { notes }
      });
    }

    return NextResponse.json({ success: true, data: person }, { status: 201 });
  } catch (error: any) {
    console.error("[API] POST /api/people error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/people - Delete a person
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Person ID is required" }, { status: 400 });
    }

    await prisma.person.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, data: { id } });
  } catch (error: any) {
    console.error("[API] DELETE /api/people error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
