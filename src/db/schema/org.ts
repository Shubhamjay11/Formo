import { relations, sql } from "drizzle-orm";
import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./auth";

export const membershipRoleEnum = pgEnum("membership_role", [
  "owner",
  "admin",
  "builder",
  "viewer",
]);

export const organizations = pgTable(
  "organizations",
  {
    id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("organizations_slug_idx").on(table.slug)],
);

export const memberships = pgTable(
  "memberships",
  {
    id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: membershipRoleEnum("role").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("memberships_org_id_idx").on(table.orgId),
    index("memberships_user_id_idx").on(table.userId),
    uniqueIndex("memberships_org_id_user_id_idx").on(table.orgId, table.userId),
  ],
);

export const organizationsRelations = relations(organizations, ({ many }) => ({
  memberships: many(memberships),
}));

export const membershipsRelations = relations(memberships, ({ one }) => ({
  organization: one(organizations, {
    fields: [memberships.orgId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [memberships.userId],
    references: [users.id],
  }),
}));
