import { Router, Response, Request } from "express";
import { db } from "@workspace/db";
import { siteSettingsTable } from "@workspace/db";
import { authenticate, requireAdmin, AuthRequest } from "../lib/auth";

const router = Router();

async function getOrCreateSettings() {
  const existing = await db.select().from(siteSettingsTable).limit(1);
  if (existing.length > 0) return existing[0];
  const [settings] = await db.insert(siteSettingsTable).values({}).returning();
  return settings;
}

router.get("/", async (_req: Request, res: Response) => {
  try {
    const settings = await getOrCreateSettings();
    res.json(settings);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/", authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const existing = await getOrCreateSettings();
    const { eq } = await import("drizzle-orm");
    const [settings] = await db.update(siteSettingsTable).set({ ...req.body, updatedAt: new Date() }).where(eq(siteSettingsTable.id, existing.id)).returning();
    res.json(settings || existing);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
