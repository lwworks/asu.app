import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const organization = sqliteTable("organization", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const membership = sqliteTable("membership", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  orgId: text("org_id")
    .notNull()
    .references(() => organization.id),
  role: text("role", { enum: ["admin", "member"] }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const invite = sqliteTable("invite", {
  id: text("id").primaryKey(),
  orgId: text("org_id")
    .notNull()
    .references(() => organization.id),
  code: text("code").notNull().unique(),
  createdBy: text("created_by").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  usedAt: integer("used_at", { mode: "timestamp" }),
  usedBy: text("used_by"),
});
