import { Router, Response, Request } from "express";
import { db } from "@workspace/db";
import { commentsTable, ratingsTable, chaptersTable } from "@workspace/db";
import { eq, and, avg, count, desc, asc } from "drizzle-orm";
import { authenticate, requireAdmin, AuthRequest } from "../lib/auth";

const router = Router();

router.get("/chapter/:chapterId", async (req: Request, res: Response) => {
  try {
    const comments = await db
      .select()
      .from(commentsTable)
      .where(and(eq(commentsTable.chapterId, req.params.chapterId), eq(commentsTable.isHidden, "false")))
      .orderBy(commentsTable.createdAt);
    res.json(comments);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/chapter/:chapterId", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) { res.status(400).json({ error: "Text required" }); return; }

    const [comment] = await db.insert(commentsTable).values({
      chapterId: req.params.chapterId,
      userId: req.user!.userId,
      username: req.user!.username,
      text: text.trim(),
    }).returning();

    res.status(201).json(comment);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Public: all visible comments for all chapters of a series
router.get("/series/:seriesId", async (req: Request, res: Response) => {
  try {
    const sort = req.query.sort === "oldest" ? "oldest" : "newest";
    const rows = await db
      .select({
        id: commentsTable.id,
        chapterId: commentsTable.chapterId,
        userId: commentsTable.userId,
        username: commentsTable.username,
        text: commentsTable.text,
        createdAt: commentsTable.createdAt,
        chapterNumber: chaptersTable.number,
      })
      .from(commentsTable)
      .innerJoin(chaptersTable, eq(commentsTable.chapterId, chaptersTable.id))
      .where(and(
        eq(chaptersTable.seriesId, req.params.seriesId),
        eq(commentsTable.isHidden, "false"),
      ))
      .orderBy(sort === "oldest" ? asc(commentsTable.createdAt) : desc(commentsTable.createdAt));
    res.json(rows);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    await db.delete(commentsTable).where(eq(commentsTable.id, req.params.id));
    res.status(204).end();
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:id/hide", authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const [updated] = await db.update(commentsTable).set({ isHidden: "true" }).where(eq(commentsTable.id, req.params.id)).returning();
    res.json(updated);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:id/unhide", authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const [updated] = await db.update(commentsTable).set({ isHidden: "false" }).where(eq(commentsTable.id, req.params.id)).returning();
    res.json(updated);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
