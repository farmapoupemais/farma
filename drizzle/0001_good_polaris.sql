CREATE TABLE `discount_redemptions` (
	`discount_id` text NOT NULL,
	`customer_email` text NOT NULL,
	`order_id` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`discount_id`, `customer_email`)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `discount_redemptions_order_id_unique` ON `discount_redemptions` (`order_id`);--> statement-breakpoint
CREATE TABLE `order_inventory_reservations` (
	`order_id` text NOT NULL,
	`product_id` text NOT NULL,
	`quantity` integer NOT NULL,
	`released_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`order_id`, `product_id`),
	CONSTRAINT "inventory_reservation_quantity_positive" CHECK("order_inventory_reservations"."quantity" > 0)
);
--> statement-breakpoint
CREATE TABLE `prescription_usages` (
	`prescription_id` text PRIMARY KEY NOT NULL,
	`customer_email` text NOT NULL,
	`order_id` text NOT NULL,
	`used_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `prescription_usages_order_id_unique` ON `prescription_usages` (`order_id`);--> statement-breakpoint
ALTER TABLE `orders` ADD `prescription_id` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `discount_id` text;--> statement-breakpoint
ALTER TABLE `prescriptions` ADD `approved_items_json` text;--> statement-breakpoint
ALTER TABLE `prescriptions` ADD `expires_at` text;--> statement-breakpoint
ALTER TABLE `prescriptions` ADD `retain_until` text DEFAULT '2026-09-23T00:00:00.000Z' NOT NULL;--> statement-breakpoint
ALTER TABLE `prescriptions` ADD `reviewed_at` text;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_products` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`short_description` text NOT NULL,
	`description` text NOT NULL,
	`category` text NOT NULL,
	`brand` text NOT NULL,
	`price_cents` integer NOT NULL,
	`compare_at_cents` integer,
	`stock` integer DEFAULT 0 NOT NULL,
	`requires_prescription` integer DEFAULT false NOT NULL,
	`regulatory_status` text DEFAULT 'approved' NOT NULL,
	`regulatory_reviewer_email` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "products_stock_nonnegative" CHECK("__new_products"."stock" >= 0)
);
--> statement-breakpoint
INSERT INTO `__new_products`("id", "slug", "name", "short_description", "description", "category", "brand", "price_cents", "compare_at_cents", "stock", "requires_prescription", "regulatory_status", "regulatory_reviewer_email", "is_active", "created_at", "updated_at") SELECT "id", "slug", "name", "short_description", "description", "category", "brand", "price_cents", "compare_at_cents", "stock", "requires_prescription", 'approved', NULL, "is_active", "created_at", "updated_at" FROM `products`;--> statement-breakpoint
DROP TABLE `products`;--> statement-breakpoint
ALTER TABLE `__new_products` RENAME TO `products`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `products_slug_unique` ON `products` (`slug`);
