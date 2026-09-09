import { sql } from "drizzle-orm";
import { check, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const products = sqliteTable("products", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  shortDescription: text("short_description").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  brand: text("brand").notNull(),
  priceCents: integer("price_cents").notNull(),
  compareAtCents: integer("compare_at_cents"),
  stock: integer("stock").notNull().default(0),
  requiresPrescription: integer("requires_prescription", { mode: "boolean" })
    .notNull()
    .default(false),
  regulatoryStatus: text("regulatory_status").notNull().default("approved"),
  regulatoryReviewerEmail: text("regulatory_reviewer_email"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [check("products_stock_nonnegative", sql`${table.stock} >= 0`)]);

export const banners = sqliteTable("banners", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  subtitle: text("subtitle").notNull(),
  ctaLabel: text("cta_label").notNull(),
  ctaHref: text("cta_href").notNull(),
  tone: text("tone").notNull().default("sage"),
  startsAt: text("starts_at"),
  endsAt: text("ends_at"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const discounts = sqliteTable("discounts", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  kind: text("kind").notNull(),
  amount: integer("amount").notNull(),
  minSubtotalCents: integer("min_subtotal_cents").notNull().default(0),
  startsAt: text("starts_at"),
  endsAt: text("ends_at"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const discountRedemptions = sqliteTable("discount_redemptions", {
  discountId: text("discount_id").notNull(),
  customerEmail: text("customer_email").notNull(),
  orderId: text("order_id").notNull().unique(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [primaryKey({ columns: [table.discountId, table.customerEmail] })]);

export const userRoles = sqliteTable("user_roles", {
  email: text("email").primaryKey(),
  role: text("role").notNull().default("customer"),
  createdBy: text("created_by").notNull(),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const orders = sqliteTable("orders", {
  id: text("id").primaryKey(),
  customerEmail: text("customer_email").notNull(),
  status: text("status").notNull().default("awaiting_payment"),
  fulfillment: text("fulfillment").notNull(),
  subtotalCents: integer("subtotal_cents").notNull(),
  discountCents: integer("discount_cents").notNull().default(0),
  shippingCents: integer("shipping_cents").notNull().default(0),
  totalCents: integer("total_cents").notNull(),
  prescriptionId: text("prescription_id"),
  discountId: text("discount_id"),
  itemsJson: text("items_json").notNull(),
  addressJson: text("address_json"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const inventoryReservations = sqliteTable("order_inventory_reservations", {
  orderId: text("order_id").notNull(),
  productId: text("product_id").notNull(),
  quantity: integer("quantity").notNull(),
  releasedAt: text("released_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  primaryKey({ columns: [table.orderId, table.productId] }),
  check("inventory_reservation_quantity_positive", sql`${table.quantity} > 0`),
]);

export const prescriptions = sqliteTable("prescriptions", {
  id: text("id").primaryKey(),
  customerEmail: text("customer_email").notNull(),
  objectKey: text("object_key").notNull().unique(),
  originalName: text("original_name").notNull(),
  contentType: text("content_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  status: text("status").notNull().default("pending_review"),
  reviewerEmail: text("reviewer_email"),
  approvedItemsJson: text("approved_items_json"),
  expiresAt: text("expires_at"),
  retainUntil: text("retain_until").notNull(),
  reviewedAt: text("reviewed_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const prescriptionUsages = sqliteTable("prescription_usages", {
  prescriptionId: text("prescription_id").primaryKey(),
  customerEmail: text("customer_email").notNull(),
  orderId: text("order_id").notNull().unique(),
  usedAt: text("used_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const auditLogs = sqliteTable("audit_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  actorEmail: text("actor_email").notNull(),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  category: text("category").notNull().default("admin"),
  userRole: text("user_role").notNull().default("system"),
  ipAddress: text("ip_address").notNull().default("127.0.0.1"),
  userAgent: text("user_agent").notNull().default("internal"),
  resource: text("resource").notNull().default(""),
  resourceId: text("resource_id").notNull().default(""),
  oldValuesJson: text("old_values_json").notNull().default("{}"),
  newValuesJson: text("new_values_json").notNull().default("{}"),
  status: text("status").notNull().default("success"),
  metadataJson: text("metadata_json").notNull().default("{}"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

