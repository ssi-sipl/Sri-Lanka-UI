const { PrismaClient } = require("@prisma/client");
const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");

const adapter = new PrismaBetterSqlite3({ url: "file:./dev.db" });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 [SEED] Seeding 4 default map cameras into SQLite database...");
  
  const cameras = [
    {
      name: "Entrance CCTV",
      location: "Main Entrance Door",
      rtspUrl: "rtsp://admin:123456Ai@192.168.1.69/snl/live/1/1?cam=entrance",
      isActive: true
    },
    {
      name: "Lobby Security Dome",
      location: "Waiting Lounge Area",
      rtspUrl: "rtsp://admin:123456Ai@192.168.1.69/snl/live/1/1?cam=lobby",
      isActive: true
    },
    {
      name: "Tellers Counter Cam",
      location: "Main Banking Hall",
      rtspUrl: "rtsp://admin:123456Ai@192.168.1.69/snl/live/1/1?cam=tellers",
      isActive: true
    },
    {
      name: "Safe Vault Internal",
      location: "Cash Vault Room",
      rtspUrl: "rtsp://admin:123456Ai@192.168.1.69/snl/live/1/1?cam=vault",
      isActive: true
    }
  ];

  for (const cam of cameras) {
    await prisma.camera.upsert({
      where: { rtspUrl: cam.rtspUrl },
      update: {
        name: cam.name,
        location: cam.location,
        isActive: cam.isActive
      },
      create: {
        name: cam.name,
        location: cam.location,
        rtspUrl: cam.rtspUrl,
        isActive: cam.isActive
      }
    });
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
