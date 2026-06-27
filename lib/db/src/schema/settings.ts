import { pgTable, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const siteSettingsTable = pgTable("site_settings", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  siteName: text("site_name").notNull().default("HEAVEN X"),
  siteEnabled: boolean("site_enabled").notNull().default(true),
  maintenanceMode: boolean("maintenance_mode").notNull().default(false),
  maintenanceMessage: text("maintenance_message"),
  countdownTarget: text("countdown_target"),
  announcement: text("announcement"),
  primaryColor: text("primary_color").notNull().default("#6366f1"),
  fontFamily: text("font_family").notNull().default("Inter"),
  bannerUrl: text("banner_url"),
  bannerOverlayText: text("banner_overlay_text"),
  bannerOverlayFont: text("banner_overlay_font"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSiteSettingsSchema = createInsertSchema(siteSettingsTable).omit({ id: true, updatedAt: true });
export type InsertSiteSettings = z.infer<typeof insertSiteSettingsSchema>;
export type SiteSettings = typeof siteSettingsTable.$inferSelect;
