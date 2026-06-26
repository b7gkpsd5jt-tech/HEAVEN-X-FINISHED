import { Router, Response } from "express";
import bcrypt from "bcrypt";
import { db } from "@workspace/db";
import { usersTable, favoritesTable, readingProgressTable, seriesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { authenticate, requireAdmin, AuthRequest } from "../lib/auth";

const router = Router();

router.get("/", authenticate, requireAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    const users = await db.select({
      id: usersTable.id,
      username: usersTable.username,
      email: usersTable.email,
      role: usersTable.role,
      isActive: usersTable.isActive,
      language: usersTable.language,
      deviceLockMode: usersTable.deviceLockMode,
      deviceId: usersTable.deviceId,
      createdAt: usersTable.createdAt,
      lastLoginAt: usersTable.lastLoginAt,
    }).from(usersTable).orderBy(usersTable.createdAt);
    res.json(users);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { username, password, email, role, language } = req.body;
    if (!username || !password) { res.status(400).json({ error: "Username and password required" }); return; }

    const hashedPassword = await bcrypt.hash(password, 12);
    const [user] = await db.insert(usersTable).values({
      username: username.toLowerCase().trim(),
      password: hashedPassword,
      email: email || null,
      role: role || "USER",
      language: language || "DE",
    }).returning({
      id: usersTable.id,
      username: usersTable.username,
      email: usersTable.email,
      role: usersTable.role,
      isActive: usersTable.isActive,
      language: usersTable.language,
      deviceLockMode: usersTable.deviceLockMode,
      createdAt: usersTable.createdAt,
    });

    res.status(201).json(user);
  } catch (err: any) {
    if (err.code === "23505") { res.status(409).json({ error: "Username already exists" }); return; }
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:id", authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { password, ...data } = req.body;
    const updateData: any = { ...data };
    if (password) updateData.password = await bcrypt.hash(password, 12);

    const [user] = await db.update(usersTable).set({ ...updateData, updatedAt: new Date() }).where(eq(usersTable.id, req.params.id)).returning({
      id: usersTable.id,
      username: usersTable.username,
      email: usersTable.email,
      role: usersTable.role,
      isActive: usersTable.isActive,
      language: usersTable.language,
      deviceLockMode: usersTable.deviceLockMode,
      createdAt: usersTable.createdAt,
      lastLoginAt: usersTable.lastLoginAt,
    });

    if (!user) { res.status(404).json({ error: "User not found" }); return; }
    res.json(user);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    await db.delete(usersTable).where(eq(usersTable.id, req.params.id));
    res.status(204).end();
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:id/reset-device", authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    await db.update(usersTable).set({ deviceId: null, deviceId2: null }).where(eq(usersTable.id, req.params.id));
    res.json({ message: "Device reset" });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/progress", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { seriesId, chapterId, page } = req.body;
    const existing = await db.select().from(readingProgressTable).where(and(eq(readingProgressTable.userId, req.user!.userId), eq(readingProgressTable.chapterId, chapterId))).limit(1);

    if (existing.length > 0) {
      await db.update(readingProgressTable).set({ page: String(page), updatedAt: new Date() }).where(and(eq(readingProgressTable.userId, req.user!.userId), eq(readingProgressTable.chapterId, chapterId)));
    } else {
      await db.insert(readingProgressTable).values({ userId: req.user!.userId, seriesId, chapterId, page: String(page) });
    }
    res.json({ message: "Progress saved" });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/favorites/:seriesId", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await db.insert(favoritesTable).values({ userId: req.user!.userId, seriesId: req.params.seriesId }).onConflictDoNothing();
    res.json({ message: "Added to favorites" });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/favorites/:seriesId", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await db.delete(favoritesTable).where(and(eq(favoritesTable.userId, req.user!.userId), eq(favoritesTable.seriesId, req.params.seriesId)));
    res.status(204).end();
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/favorites", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const favorites = await db
      .select({ series: seriesTable })
      .from(favoritesTable)
      .innerJoin(seriesTable, eq(favoritesTable.seriesId, seriesTable.id))
      .where(eq(favoritesTable.userId, req.user!.userId));
    res.json(favorites.map(f => f.series));
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
