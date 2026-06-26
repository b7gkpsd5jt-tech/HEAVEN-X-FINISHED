import { pgTable, text, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const socialLinksTable = pgTable("social_links", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  platform: text("platform").notNull(),
  url: text("url").notNull(),
  label: text("label"),
  isEnabled: boolean("is_enabled").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSocialLinkSchema = createInsertSchema(socialLinksTable).omit({ id: true, createdAt: true });
export type InsertSocialLink = z.infer<typeof insertSocialLinkSchema>;
export type SocialLink = typeof socialLinksTable.$inferSelect;
