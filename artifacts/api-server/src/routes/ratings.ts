import { Router, Response } from "express";
import { db } from "@workspace/db";
import { ratingsTable } from "@workspace/db";
import { eq, and, avg, count } from "drizzle-orm";
import { authenticate, AuthRequest } from "../lib/auth";

const router = Router();

// GET: fetch average + user's own rating for a chapter
router.get("/chapter/:chapterId", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const [result] = await db
      .select({ average: avg(ratingsTable.stars), total: count() })
      .from(ratingsTable)
      .where(eq(ratingsTable.chapterId, req.params.chapterId));

    const userRows = await db
      .select({ stars: ratingsTable.stars })
      .from(ratingsTable)
      .where(and(
        eq(ratingsTable.chapterId, req.params.chapterId),
        eq(ratingsTable.userId, req.user!.userId)
      ))
      .limit(1);

    res.json({
      average: Number(result.average || 0),
      count: Number(result.total || 0),
      userRating: userRows[0]?.stars || 0,
    });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST: upsert rating (1-5 stars)
router.post("/chapter/:chapterId", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { stars } = req.body;
    if (!stars || stars < 1 || stars > 5) {
      res.status(400).json({ error: "Stars must be 1-5" });
      return;
    }

    const existing = await db
      .select()
      .from(ratingsTable)
      .where(and(
        eq(ratingsTable.chapterId, req.params.chapterId),
        eq(ratingsTable.userId, req.user!.userId)
      ))
      .limit(1);

    if (existing.length > 0) {
      await db.update(ratingsTable)
        .set({ stars })
        .where(and(
          eq(ratingsTable.chapterId, req.params.chapterId),
          eq(ratingsTable.userId, req.user!.userId)
        ));
    } else {
      await db.insert(ratingsTable).values({
        chapterId: req.params.chapterId,
        userId: req.user!.userId,
        stars,
      });
    }

    const [result] = await db
      .select({ average: avg(ratingsTable.stars), total: count() })
      .from(ratingsTable)
      .where(eq(ratingsTable.chapterId, req.params.chapterId));

    res.json({
      average: Number(result.average || 0),
      count: Number(result.total || 0),
      userRating: stars,
    });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
