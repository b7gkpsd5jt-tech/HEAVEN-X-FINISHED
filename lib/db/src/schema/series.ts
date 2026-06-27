import { pgTable, text, boolean, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const seriesStatusEnum = pgEnum("series_status", ["ONGOING", "COMPLETED", "HIATUS", "DROPPED"]);

export const seriesTable = pgTable("series", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  altTitle: text("alt_title"),
  description: text("description"),
  cover: text("cover"),
  banner: text("banner"),
  author: text("author"),
  artist: text("artist"),
  status: seriesStatusEnum("status").notNull().default("ONGOING"),
  titleFont: text("title_font"),
  views: integer("views").notNull().default(0),
  likes: integer("likes").notNull().default(0),
  popularity: integer("popularity").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const genresTable = pgTable("genres", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull().unique(),
});

export const seriesGenresTable = pgTable("series_genres", {
  seriesId: text("series_id").notNull().references(() => seriesTable.id, { onDelete: "cascade" }),
  genreId: text("genre_id").notNull().references(() => genresTable.id, { onDelete: "cascade" }),
});

export const insertSeriesSchema = createInsertSchema(seriesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSeries = z.infer<typeof insertSeriesSchema>;
export type Series = typeof seriesTable.$inferSelect;
