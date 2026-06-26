import { pgTable, text, boolean, timestamp, pgEnum, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const roleEnum = pgEnum("role", ["ADMIN", "USER"]);
export const languageEnum = pgEnum("language", ["DE", "EN", "FA"]);
export const deviceLockEnum = pgEnum("device_lock_mode", ["ONE", "TWO", "UNLIMITED"]);

export const usersTable = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  username: varchar("username", { length: 100 }).notNull().unique(),
  email: varchar("email", { length: 255 }).unique(),
  password: text("password").notNull(),
  role: roleEnum("role").notNull().default("USER"),
  isActive: boolean("is_active").notNull().default(true),
  language: languageEnum("language").notNull().default("DE"),
  readMode: text("read_mode").notNull().default("NORMAL"),
  darkMode: boolean("dark_mode").notNull().default(true),
  deviceId: text("device_id"),
  deviceLockMode: deviceLockEnum("device_lock_mode").notNull().default("ONE"),
  deviceId2: text("device_id_2"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  lastLoginAt: timestamp("last_login_at"),
});

export const refreshTokensTable = pgTable("refresh_tokens", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  token: text("token").notNull().unique(),
  userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const readingProgressTable = pgTable("reading_progress", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  seriesId: text("series_id").notNull(),
  chapterId: text("chapter_id").notNull(),
  page: text("page").notNull().default("1"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const favoritesTable = pgTable("favorites", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  seriesId: text("series_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
