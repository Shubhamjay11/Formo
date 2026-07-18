import { relations, sql } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { organizations } from "./org";

export const formStatusEnum = pgEnum("form_status", ["draft", "published"]);

export type FormStatus = (typeof formStatusEnum.enumValues)[number];

export const forms = pgTable(
  "forms",
  {
    id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    status: formStatusEnum("status").default("draft").notNull(),
    fields: jsonb("fields").$type<unknown[]>().default([]).notNull(),
    schemaVersion: integer("schema_version").default(1).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("forms_org_id_idx").on(table.orgId),
    uniqueIndex("forms_org_id_slug_idx").on(table.orgId, table.slug),
    index("forms_org_id_updated_at_idx").on(table.orgId, table.updatedAt),
  ],
);

export const formsRelations = relations(forms, ({ one }) => ({
  organization: one(organizations, {
    fields: [forms.orgId],
    references: [organizations.id],
  }),
}));
