-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'TECHNICIAN',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "technicians" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "specialization" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "installation_forms" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "form_number" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "technician_id" TEXT,
    "request_date" DATETIME NOT NULL,
    "planned_install_date" DATETIME NOT NULL,
    "actual_install_date" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'RECEIVED',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "installation_address" TEXT NOT NULL,
    "contact_person" TEXT NOT NULL,
    "contact_phone" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "installation_forms_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "installation_forms_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "installation_forms_technician_id_fkey" FOREIGN KEY ("technician_id") REFERENCES "technicians" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "installation_devices" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "installation_form_id" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "device_name" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "serial_number" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "installationStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "installation_devices_installation_form_id_fkey" FOREIGN KEY ("installation_form_id") REFERENCES "installation_forms" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "device_repairs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "repair_number" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "technician_id" TEXT,
    "device_name" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "serial_number" TEXT NOT NULL,
    "brand" TEXT,
    "received_date" DATETIME NOT NULL,
    "completed_date" DATETIME,
    "estimated_completion" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'RECEIVED',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "problem_description" TEXT NOT NULL,
    "diagnosis_notes" TEXT,
    "repair_notes" TEXT,
    "is_warranty" BOOLEAN NOT NULL DEFAULT false,
    "warranty_info" TEXT,
    "labor_cost" REAL,
    "parts_cost" REAL,
    "distributor_cost" REAL,
    "internal_service_cost" REAL,
    "total_cost" REAL,
    "repair_cost" REAL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "device_repairs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "device_repairs_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "device_repairs_technician_id_fkey" FOREIGN KEY ("technician_id") REFERENCES "technicians" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "cargo_companies" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "cargo_trackings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tracking_number" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'IN_TRANSIT',
    "record_status" TEXT NOT NULL DEFAULT 'OPEN',
    "sender" TEXT NOT NULL,
    "receiver" TEXT NOT NULL,
    "cargo_company" TEXT,
    "cargo_company_id" TEXT,
    "sent_date" DATETIME,
    "delivered_date" DATETIME,
    "destination" TEXT NOT NULL,
    "destination_address" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "cargo_trackings_cargo_company_id_fkey" FOREIGN KEY ("cargo_company_id") REFERENCES "cargo_companies" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "cargo_devices" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cargo_id" TEXT NOT NULL,
    "device_name" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "serial_number" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "condition" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "cargo_devices_cargo_id_fkey" FOREIGN KEY ("cargo_id") REFERENCES "cargo_trackings" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "vendors" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "contact_person" TEXT,
    "contact_phone" TEXT,
    "contact_email" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "vendor_products" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vendor_id" TEXT NOT NULL,
    "device_name" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "serial_number" TEXT NOT NULL,
    "brand" TEXT,
    "problem_description" TEXT NOT NULL,
    "current_status" TEXT NOT NULL DEFAULT 'AT_VENDOR',
    "sent_date" DATETIME,
    "received_date" DATETIME,
    "estimated_return" DATETIME,
    "cost" REAL,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "vendor_products_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "vendor_product_status_history" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "product_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "status_date" DATETIME NOT NULL,
    "notes" TEXT,
    "updated_by" TEXT NOT NULL,
    "updated_by_name" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "vendor_product_status_history_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "vendor_products" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "technical_services" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "operating_personnel" TEXT,
    "invoice_date" DATETIME,
    "brand" TEXT,
    "business_name" TEXT NOT NULL,
    "device_name" TEXT NOT NULL,
    "model" TEXT,
    "device_serial" TEXT,
    "service_entry_date" DATETIME,
    "service_exit_date" DATETIME,
    "device_problem" TEXT,
    "problem_description" TEXT,
    "performed_action" TEXT,
    "service_cost" REAL,
    "customer_cost" REAL,
    "approved_by" TEXT,
    "connect_written" TEXT,
    "vendor_name" TEXT,
    "is_at_vendor" BOOLEAN NOT NULL DEFAULT false,
    "vendor_entry_date" DATETIME,
    "vendor_exit_date" DATETIME,
    "vendor_status" TEXT DEFAULT 'NOT_AT_VENDOR',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "device_brands" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "device_models" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "brand_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "device_models_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "device_brands" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "locations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT,
    "district" TEXT,
    "phone" TEXT,
    "contact_person" TEXT,
    "type" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "equivalent_devices" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "device_number" TEXT NOT NULL,
    "device_name" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "serial_number" TEXT NOT NULL,
    "current_location" TEXT NOT NULL DEFAULT 'IN_WAREHOUSE',
    "record_status" TEXT NOT NULL DEFAULT 'OPEN',
    "location_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "assigned_to_id" TEXT,
    "assigned_date" DATETIME,
    "purchase_date" DATETIME,
    "warranty_end" DATETIME,
    "condition" TEXT NOT NULL DEFAULT 'GOOD',
    "images" TEXT,
    "notes" TEXT,
    "created_by" TEXT,
    "created_by_name" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "equivalent_devices_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "equivalent_device_history" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "device_id" TEXT NOT NULL,
    "previous_location" TEXT NOT NULL,
    "new_location" TEXT NOT NULL,
    "previous_location_id" TEXT,
    "new_location_id" TEXT,
    "previous_status" TEXT,
    "new_status" TEXT,
    "assigned_to_id" TEXT,
    "assigned_to_name" TEXT,
    "notes" TEXT,
    "changed_by" TEXT NOT NULL,
    "changed_by_name" TEXT NOT NULL,
    "changed_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "equivalent_device_history_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "equivalent_devices" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "installation_forms_form_number_key" ON "installation_forms"("form_number");

-- CreateIndex
CREATE UNIQUE INDEX "device_repairs_repair_number_key" ON "device_repairs"("repair_number");

-- CreateIndex
CREATE UNIQUE INDEX "cargo_companies_name_key" ON "cargo_companies"("name");

-- CreateIndex
CREATE UNIQUE INDEX "cargo_trackings_tracking_number_key" ON "cargo_trackings"("tracking_number");

-- CreateIndex
CREATE UNIQUE INDEX "vendors_name_key" ON "vendors"("name");

-- CreateIndex
CREATE UNIQUE INDEX "device_brands_name_key" ON "device_brands"("name");

-- CreateIndex
CREATE UNIQUE INDEX "device_models_brand_id_name_key" ON "device_models"("brand_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "equivalent_devices_device_number_key" ON "equivalent_devices"("device_number");

-- CreateIndex
CREATE UNIQUE INDEX "equivalent_devices_serial_number_key" ON "equivalent_devices"("serial_number");
