-- Add consignment flags for model catalog and vendor tracking
ALTER TABLE "device_models" ADD COLUMN "is_consignment" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "vendor_products" ADD COLUMN "is_consignment" BOOLEAN NOT NULL DEFAULT false;
