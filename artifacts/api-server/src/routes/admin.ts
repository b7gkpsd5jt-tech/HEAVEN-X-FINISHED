import { Router, Response } from "express";
import { db } from "@workspace/db";
import { usersTable, seriesTable, chaptersTable, chapterPagesTable, commentsTable } from "@workspace/db";
import { count, desc, eq } from "drizzle-orm";
import { authenticate, requireAdmin, AuthRequest } from "../lib/auth";

const router = Router();

router.get("/stats", authenticate, requireAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    const [userCount, seriesCount, chapterCount, pageCount, commentCount, recentUploads] = await Promise.all([
      db.select({ count: count() }).from(usersTable).then(r => Number(r[0]?.count || 0)),
      db.select({ count: count() }).from(seriesTable).then(r => Number(r[0]?.count || 0)),
      db.select({ count: count() }).from(chaptersTable).then(r => Number(r[0]?.count || 0)),
      db.select({ count: count() }).from(chapterPagesTable).then(r => Number(r[0]?.count || 0)),
      db.select({ count: count() }).from(commentsTable).then(r => Number(r[0]?.count || 0)),
      db.select().from(chaptersTable).orderBy(desc(chaptersTable.createdAt)).limit(10),
    ]);

    res.json({ userCount, seriesCount, chapterCount, pageCount, commentCount, recentUploads });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/all-comments", authenticate, requireAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    const rows = await db
      .select({
        id: commentsTable.id,
        chapterId: commentsTable.chapterId,
        userId: commentsTable.userId,
        username: commentsTable.username,
        text: commentsTable.text,
        isHidden: commentsTable.isHidden,
        createdAt: commentsTable.createdAt,
        chapterNumber: chaptersTable.number,
        seriesTitle: seriesTable.title,
      })
      .from(commentsTable)
      .leftJoin(chaptersTable, eq(commentsTable.chapterId, chaptersTable.id))
      .leftJoin(seriesTable, eq(chaptersTable.seriesId, seriesTable.id))
      .orderBy(desc(commentsTable.createdAt));
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET all comments for all chapters of a specific series
router.get("/series/:seriesId/comments", authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const rows = await db
      .select({
        id: commentsTable.id,
        chapterId: commentsTable.chapterId,
        userId: commentsTable.userId,
        username: commentsTable.username,
        text: commentsTable.text,
        isHidden: commentsTable.isHidden,
        createdAt: commentsTable.createdAt,
        chapterNumber: chaptersTable.number,
      })
      .from(commentsTable)
      .innerJoin(chaptersTable, eq(commentsTable.chapterId, chaptersTable.id))
      .where(eq(chaptersTable.seriesId, req.params.seriesId))
      .orderBy(desc(commentsTable.createdAt));
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
