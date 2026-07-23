const { PrismaClient } = require("@prisma/client");
const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");

const adapter = new PrismaBetterSqlite3({ url: "file:./dev.db" });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🧹 [SEED] Clearing old camera and alert records to prevent duplicates...");
  await prisma.alert.updateMany({ data: { cameraId: null } });
  await prisma.camera.deleteMany({});
  
  console.log("🌱 [SEED] Seeding 4 fresh default map cameras into SQLite database...");
  
  const cameras = [
    {
      name: "Entrance CCTV",
      location: "Main Entrance Door",
      rtspUrl: "rtsp://admin:123456Ai@192.168.1.69:554/snl/live/1/1",
      isActive: true
    },
    {
      name: "Lobby Security Dome",
      location: "Waiting Lounge Area",
      rtspUrl: "rtsp://admin:123456Ai@192.168.1.69:554/snl/live/1/1",
      isActive: true
    },
    {
      name: "Tellers Counter Cam",
      location: "Main Banking Hall",
      rtspUrl: "rtsp://admin:123456Ai@192.168.1.69:554/snl/live/1/1",
      isActive: true
    },
    {
      name: "Safe Vault Internal",
      location: "Cash Vault Room",
      rtspUrl: "rtsp://admin:123456Ai@192.168.1.69:554/snl/live/1/1",
      isActive: true
    }
  ];

  for (const cam of cameras) {
    const existing = await prisma.camera.findFirst({
      where: { name: cam.name }
    });
    
    if (existing) {
      await prisma.camera.update({
        where: { id: existing.id },
        data: {
          rtspUrl: cam.rtspUrl,
          location: cam.location,
          isActive: cam.isActive
        }
      });
    } else {
      await prisma.camera.create({
        data: {
          name: cam.name,
          rtspUrl: cam.rtspUrl,
          location: cam.location,
          isActive: cam.isActive
        }
      });
    }
  }
  
  console.log("✅ [SEED] Database cameras seeded successfully!");
}

main()
  .catch((e) => {
    console.error("❌ [SEED] Error seeding cameras:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
