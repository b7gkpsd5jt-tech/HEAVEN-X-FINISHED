import { Router, Response, Request } from "express";
import { db } from "@workspace/db";
import { commentsTable, ratingsTable } from "@workspace/db";
import { eq, and, avg, count } from "drizzle-orm";
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
