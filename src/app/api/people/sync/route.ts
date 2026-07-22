import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import fs from "fs";

// GET /api/people/sync - Sync people from the Python recognition system
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const customUrl = searchParams.get("url");
    const pythonRestUrl = customUrl || process.env.PYTHON_REST_URL || "http://localhost:8766";
    const syncUrl = `${pythonRestUrl}/api/people`;

    console.log(`[Sync] Attempting to sync people registry from: ${syncUrl}`);

    let pythonPeople: { name: string }[] = [];
    let sourceUsed = "Python REST API";

    try {
      const response = await fetch(syncUrl, {
        signal: AbortSignal.timeout(3000)
      });
      if (response.ok) {
        const json = await response.json();
        pythonPeople = json.people || [];
        console.log(`[Sync] Successfully retrieved ${pythonPeople.length} people from Python REST API.`);
      } else {
        console.warn(`[Sync] Python REST endpoint returned status: ${response.status}`);
      }
    } catch (e: any) {
      console.warn(`[Sync] Failed to reach Python REST API at ${syncUrl}: ${e.message}`);
    }

    // Direct CSV fallback if HTTP API is offline or returned empty list
    if (pythonPeople.length === 0) {
      console.log(`[Sync] HTTP endpoint returned 0 identities. Attempting local CSV fallbacks...`);
      const possiblePaths = [
        "/Users/abhinnvyas/Projects/NotyCircuitsPvtLtd/Advance-Face-Recognition/data/encodings.csv",
        "/Users/abhinnvyas/Projects/NotyCircuitsPvtLtd/Advance-Face-Recognition/data/people.csv"
      ];

      for (const csvPath of possiblePaths) {
        if (fs.existsSync(csvPath)) {
          try {
            console.log(`[Sync] Reading local CSV file: ${csvPath}`);
            const content = fs.readFileSync(csvPath, "utf-8");
            const lines = content.split(/\r?\n/);
            if (lines.length > 1) {
              const headers = lines[0].split(",");
              const nameIndex = headers.indexOf("name");
              if (nameIndex !== -1) {
                const namesSet = new Set<string>();
                for (let i = 1; i < lines.length; i++) {
                  if (!lines[i]) continue;
                  // Handle comma inside column values if necessary (simple split is fine for standard name columns)
                  const cols = lines[i].split(",");
                  const rawName = cols[nameIndex];
                  if (rawName) {
                    namesSet.add(rawName.trim().toLowerCase());
                  }
                }
                pythonPeople = Array.from(namesSet).map(name => ({ name }));
                sourceUsed = `Local CSV (${csvPath.split("/").pop()})`;
                console.log(`[Sync] Fallback loaded ${pythonPeople.length} people from: ${csvPath}`);
                break;
              }
            }
          } catch (csvErr: any) {
            console.warn(`[Sync] Failed to read fallback CSV at ${csvPath}: ${csvErr.message}`);
          }
        }
      }
    }

    // Upsert Python people into our local database
    const syncResults = [];
    for (const p of pythonPeople) {
      const name = p.name.trim().toLowerCase();
      if (!name) continue;

      try {
        const person = await prisma.person.upsert({
          where: { name },
          update: {}, // Keep existing record, do not overwrite notes
          create: { name }
        });
        syncResults.push(person);
      } catch (upsertErr) {
        console.error(`[Sync] Failed to upsert person: ${name}`, upsertErr);
      }
    }

    // Fetch the updated full list of people to return
    const allPeople = await prisma.person.findMany({
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

    console.log(`[Sync] Synchronization completed. Merged ${syncResults.length} identities via ${sourceUsed}.`);

    return NextResponse.json({
      success: true,
      addedCount: syncResults.length,
      source: sourceUsed,
      data: allPeople
    });
  } catch (error: any) {
    console.error("[API] GET /api/people/sync error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
