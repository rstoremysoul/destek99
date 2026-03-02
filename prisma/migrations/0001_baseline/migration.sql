-- CreateTable
CREATE TABLE "incoming_cargo_companies" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "incoming_cargo_branches" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "company_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "incoming_cargo_branches_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "incoming_cargo_companies" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "incoming_cargo_fault_options" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "incoming_cargo_fault_options_name_key" ON "incoming_cargo_fault_options"("name");

-- CreateIndex
CREATE UNIQUE INDEX "incoming_cargo_companies_name_key" ON "incoming_cargo_companies"("name");

-- CreateIndex
CREATE UNIQUE INDEX "incoming_cargo_branches_company_id_name_key" ON "incoming_cargo_branches"("company_id", "name");

