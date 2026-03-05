-- CreateTable
CREATE TABLE "incoming_cargo_carrier_personnel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "incoming_cargo_carrier_personnel_name_key" ON "incoming_cargo_carrier_personnel"("name");
