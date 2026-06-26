import { Router, Response, Request } from "express";
import { db } from "@workspace/db";
import { socialLinksTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { authenticate, requireAdmin, AuthRequest } from "../lib/auth";

const router = Router();

router.get("/", async (_req: Request, res: Response) => {
  try {
    const links = await db.select().from(socialLinksTable).where(eq(socialLinksTable.isEnabled, true)).orderBy(asc(socialLinksTable.sortOrder));
    res.json(links);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { platform, url, label, isEnabled, sortOrder } = req.body;
    const [link] = await db.insert(socialLinksTable).values({ platform, url, label, isEnabled: isEnabled ?? true, sortOrder: sortOrder ?? 0 }).returning();
    res.status(201).json(link);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:id", authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const [link] = await db.update(socialLinksTable).set(req.body).where(eq(socialLinksTable.id, req.params.id)).returning();
    if (!link) { res.status(404).json({ error: "Not found" }); return; }
    res.json(link);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    await db.delete(socialLinksTable).where(eq(socialLinksTable.id, req.params.id));
    res.status(204).end();
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Admin: get all links including disabled
router.get("/all", authenticate, requireAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    const links = await db.select().from(socialLinksTable).orderBy(asc(socialLinksTable.sortOrder));
    res.json(links);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
