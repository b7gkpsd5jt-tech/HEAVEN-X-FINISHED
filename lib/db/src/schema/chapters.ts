import { pgTable, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { seriesTable } from "./series";

export const chaptersTable = pgTable("chapters", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  seriesId: text("series_id").notNull().references(() => seriesTable.id, { onDelete: "cascade" }),
  number: integer("number").notNull(),
  title: text("title"),
  views: integer("views").notNull().default(0),
  pageCount: integer("page_count").notNull().default(0),
  sortOrder: integer("sort_order").notNull().default(0),
  uploadDate: timestamp("upload_date").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const chapterPagesTable = pgTable("chapter_pages", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  chapterId: text("chapter_id").notNull().references(() => chaptersTable.id, { onDelete: "cascade" }),
  pageNumber: integer("page_number").notNull(),
  filePath: text("file_path").notNull(),
  fileName: text("file_name").notNull(),
  order: integer("order").notNull(),
});

export const ratingsTable = pgTable("ratings", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  chapterId: text("chapter_id").notNull().references(() => chaptersTable.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  stars: integer("stars").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const commentsTable = pgTable("comments", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  chapterId: text("chapter_id").notNull().references(() => chaptersTable.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  username: text("username").notNull(),
  text: text("text").notNull(),
  isHidden: text("is_hidden").notNull().default("false"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertChapterSchema = createInsertSchema(chaptersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertChapter = z.infer<typeof insertChapterSchema>;
export type Chapter = typeof chaptersTable.$inferSelect;
