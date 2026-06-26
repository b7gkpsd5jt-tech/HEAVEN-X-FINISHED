import { Router, Response, Request } from "express";
import { db } from "@workspace/db";
import { popupsTable } from "@workspace/db";
import { eq, and, lte, gte, or, isNull } from "drizzle-orm";
import { authenticate, requireAdmin, AuthRequest } from "../lib/auth";

const router = Router();

// Public: get active popups
router.get("/", async (_req: Request, res: Response) => {
  try {
    const now = new Date();
    const popups = await db.select().from(popupsTable).where(eq(popupsTable.isEnabled, true));
    // Filter by schedule if set
    const active = popups.filter(p => {
      if (!p.scheduleStart && !p.scheduleEnd) return true;
      const afterStart = !p.scheduleStart || p.scheduleStart <= now;
      const beforeEnd = !p.scheduleEnd || p.scheduleEnd >= now;
      return afterStart && beforeEnd;
    });
    res.json(active);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Admin: all popups
router.get("/all", authenticate, requireAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    const popups = await db.select().from(popupsTable).orderBy(popupsTable.createdAt);
    res.json(popups);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { title, content, buttonText, buttonUrl, closeText, isEnabled, scheduleStart, scheduleEnd } = req.body;
    const [popup] = await db.insert(popupsTable).values({
      title, content, buttonText, buttonUrl, closeText,
      isEnabled: isEnabled ?? true,
      scheduleStart: scheduleStart ? new Date(scheduleStart) : null,
      scheduleEnd: scheduleEnd ? new Date(scheduleEnd) : null,
    }).returning();
    res.status(201).json(popup);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:id", authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { scheduleStart, scheduleEnd, ...rest } = req.body;
    const [popup] = await db.update(popupsTable).set({
      ...rest,
      ...(scheduleStart !== undefined ? { scheduleStart: scheduleStart ? new Date(scheduleStart) : null } : {}),
      ...(scheduleEnd !== undefined ? { scheduleEnd: scheduleEnd ? new Date(scheduleEnd) : null } : {}),
    }).where(eq(popupsTable.id, req.params.id)).returning();
    if (!popup) { res.status(404).json({ error: "Not found" }); return; }
    res.json(popup);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    await db.delete(popupsTable).where(eq(popupsTable.id, req.params.id));
    res.status(204).end();
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
