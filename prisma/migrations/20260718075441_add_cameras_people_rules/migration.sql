-- CreateTable
CREATE TABLE "Camera" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "rtspUrl" TEXT NOT NULL,
    "location" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Person" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "CameraPersonRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cameraId" TEXT,
    "personId" TEXT NOT NULL,
    "listType" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CameraPersonRule_cameraId_fkey" FOREIGN KEY ("cameraId") REFERENCES "Camera" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CameraPersonRule_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Alert" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "score" REAL NOT NULL,
    "source" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "faceImage" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "cameraId" TEXT,
    CONSTRAINT "Alert_cameraId_fkey" FOREIGN KEY ("cameraId") REFERENCES "Camera" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Alert" ("faceImage", "id", "name", "score", "source", "timestamp") SELECT "faceImage", "id", "name", "score", "source", "timestamp" FROM "Alert";
DROP TABLE "Alert";
ALTER TABLE "new_Alert" RENAME TO "Alert";
CREATE INDEX "Alert_category_idx" ON "Alert"("category");
CREATE INDEX "Alert_source_idx" ON "Alert"("source");
CREATE INDEX "Alert_timestamp_idx" ON "Alert"("timestamp");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Camera_rtspUrl_key" ON "Camera"("rtspUrl");

-- CreateIndex
CREATE UNIQUE INDEX "Person_name_key" ON "Person"("name");

-- CreateIndex
CREATE INDEX "CameraPersonRule_personId_idx" ON "CameraPersonRule"("personId");

-- CreateIndex
CREATE UNIQUE INDEX "CameraPersonRule_cameraId_personId_key" ON "CameraPersonRule"("cameraId", "personId");
