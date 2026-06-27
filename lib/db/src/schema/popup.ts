import { pgTable, text, boolean, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const popupsTable = pgTable("popups", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  content: text("content").notNull(),
  buttonText: text("button_text"),
  buttonUrl: text("button_url"),
  closeText: text("close_text"),
  isEnabled: boolean("is_enabled").notNull().default(true),
  scheduleStart: timestamp("schedule_start"),
  scheduleEnd: timestamp("schedule_end"),
  displayDurationHours: integer("display_duration_hours"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPopupSchema = createInsertSchema(popupsTable).omit({ id: true, createdAt: true });
export type InsertPopup = z.infer<typeof insertPopupSchema>;
export type Popup = typeof popupsTable.$inferSelect;
