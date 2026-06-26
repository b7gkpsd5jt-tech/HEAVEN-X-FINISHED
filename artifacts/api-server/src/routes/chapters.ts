import { Router, Response, Request } from "express";
import path from "path";
import fs from "fs";
import { db } from "@workspace/db";
import { chaptersTable, chapterPagesTable, seriesTable } from "@workspace/db";
import { eq, asc, desc, lt, gt, and } from "drizzle-orm";
import { authenticate, requireAdmin, AuthRequest } from "../lib/auth";

const router = Router();
const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";

router.get("/series/:seriesId", async (req: Request, res: Response) => {
  try {
    const chapters = await db
      .select()
      .from(chaptersTable)
      .where(eq(chaptersTable.seriesId, req.params.seriesId))
      .orderBy(asc(chaptersTable.number));
    res.json(chapters);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const [chapter] = await db.select().from(chaptersTable).where(eq(chaptersTable.id, req.params.id)).limit(1);
    if (!chapter) { res.status(404).json({ error: "Chapter not found" }); return; }

    const [series, pages, prevChapter, nextChapter] = await Promise.all([
      db.select({ id: seriesTable.id, title: seriesTable.title }).from(seriesTable).where(eq(seriesTable.id, chapter.seriesId)).limit(1).then(r => r[0]),
      db.select().from(chapterPagesTable).where(eq(chapterPagesTable.chapterId, chapter.id)).orderBy(asc(chapterPagesTable.order)),
      db.select({ id: chaptersTable.id, number: chaptersTable.number, title: chaptersTable.title }).from(chaptersTable).where(and(eq(chaptersTable.seriesId, chapter.seriesId), lt(chaptersTable.number, chapter.number))).orderBy(desc(chaptersTable.number)).limit(1).then(r => r[0] || null),
      db.select({ id: chaptersTable.id, number: chaptersTable.number, title: chaptersTable.title }).from(chaptersTable).where(and(eq(chaptersTable.seriesId, chapter.seriesId), gt(chaptersTable.number, chapter.number))).orderBy(asc(chaptersTable.number)).limit(1).then(r => r[0] || null),
    ]);

    await db.update(chaptersTable).set({ views: chapter.views + 1 }).where(eq(chaptersTable.id, chapter.id));

    res.json({ ...chapter, series, pages, prevChapter, nextChapter });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    // Get all pages before deleting to clean up files
    const pages = await db
      .select({ filePath: chapterPagesTable.filePath })
      .from(chapterPagesTable)
      .where(eq(chapterPagesTable.chapterId, req.params.id));

    // Delete from DB (cascade removes pages automatically)
    await db.delete(chaptersTable).where(eq(chaptersTable.id, req.params.id));

    // Delete physical image files
    const deletedDirs = new Set<string>();
    for (const page of pages) {
      try {
        // Convert /uploads/Series/Chapter001/001.jpg → absolute path
        const relativePath = page.filePath.replace(/^\/uploads\//, "");
        const fullPath = path.join(UPLOAD_DIR, relativePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
          deletedDirs.add(path.dirname(fullPath));
        }
      } catch { /* best-effort file deletion */ }
    }

    // Remove empty chapter directories
    for (const dir of deletedDirs) {
      try {
        if (fs.existsSync(dir)) {
          const remaining = fs.readdirSync(dir);
          if (remaining.length === 0) {
            fs.rmdirSync(dir);
            // Also try to remove parent series dir if empty
            const parent = path.dirname(dir);
            const parentContents = fs.readdirSync(parent);
            if (parentContents.length === 0) fs.rmdirSync(parent);
          }
        }
      } catch { /* best-effort dir cleanup */ }
    }

    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
