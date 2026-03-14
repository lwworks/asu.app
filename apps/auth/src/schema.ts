import {
  pgTable,
  text,
  timestamp,
  primaryKey,
} from "drizzle-orm/pg-core";

export const organization = pgTable("organization", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const membership = pgTable("membership", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  orgId: text("org_id")
    .notNull()
    .references(() => organization.id),
  role: text("role", { enum: ["admin", "member"] }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const invite = pgTable("invite", {
  id: text("id").primaryKey(),
  orgId: text("org_id")
    .notNull()
    .references(() => organization.id),
  code: text("code").notNull().unique(),
  createdBy: text("created_by").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  usedBy: text("used_by"),
});
