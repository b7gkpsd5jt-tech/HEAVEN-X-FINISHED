import { Router, Response, Request } from "express";
import { db } from "@workspace/db";
import { seriesTable, genresTable, seriesGenresTable, chaptersTable } from "@workspace/db";
import { eq, ilike, or, desc, asc, sql, inArray } from "drizzle-orm";
import { authenticate, requireAdmin, AuthRequest } from "../lib/auth";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const { search, status, sort = "newest", page = "1", limit = "20" } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const offset = (pageNum - 1) * limitNum;

    let query = db.select().from(seriesTable);
    if (search) {
      query = query.where(or(ilike(seriesTable.title, `%${search}%`), ilike(seriesTable.altTitle || "", `%${search}%`))) as any;
    }
    if (status) {
      query = query.where(eq(seriesTable.status, status as any)) as any;
    }

    const orderMap: Record<string, any> = {
      newest: desc(seriesTable.createdAt),
      popular: desc(seriesTable.popularity),
      views: desc(seriesTable.views),
      alphabetical: asc(seriesTable.title),
    };
    query = query.orderBy(orderMap[sort] || desc(seriesTable.createdAt)) as any;

    const [allSeries, countResult] = await Promise.all([
      query.limit(limitNum).offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(seriesTable),
    ]);

    const total = Number(countResult[0]?.count || 0);

    // Attach genres
    const seriesWithGenres = await Promise.all(
      allSeries.map(async (s) => {
        const genreRows = await db
          .select({ genre: { id: genresTable.id, name: genresTable.name } })
          .from(seriesGenresTable)
          .innerJoin(genresTable, eq(seriesGenresTable.genreId, genresTable.id))
          .where(eq(seriesGenresTable.seriesId, s.id));
        const chapterCount = await db.select({ count: sql<number>`count(*)` }).from(chaptersTable).where(eq(chaptersTable.seriesId, s.id));
        return { ...s, genres: genreRows, _count: { chapters: Number(chapterCount[0]?.count || 0) } };
      })
    );

    res.json({ data: seriesWithGenres, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/trending", async (_req: Request, res: Response) => {
  try {
    const series = await db.select().from(seriesTable).orderBy(desc(seriesTable.popularity)).limit(12);
    const result = await Promise.all(series.map(async (s) => {
      const genreRows = await db.select({ genre: { id: genresTable.id, name: genresTable.name } }).from(seriesGenresTable).innerJoin(genresTable, eq(seriesGenresTable.genreId, genresTable.id)).where(eq(seriesGenresTable.seriesId, s.id));
      const chapterCount = await db.select({ count: sql<number>`count(*)` }).from(chaptersTable).where(eq(chaptersTable.seriesId, s.id));
      return { ...s, genres: genreRows, _count: { chapters: Number(chapterCount[0]?.count || 0) } };
    }));
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/latest", async (_req: Request, res: Response) => {
  try {
    const series = await db.select().from(seriesTable).orderBy(desc(seriesTable.updatedAt)).limit(20);
    const result = await Promise.all(series.map(async (s) => {
      const genreRows = await db.select({ genre: { id: genresTable.id, name: genresTable.name } }).from(seriesGenresTable).innerJoin(genresTable, eq(seriesGenresTable.genreId, genresTable.id)).where(eq(seriesGenresTable.seriesId, s.id));
      const chapterCount = await db.select({ count: sql<number>`count(*)` }).from(chaptersTable).where(eq(chaptersTable.seriesId, s.id));
      const latestChapter = await db.select().from(chaptersTable).where(eq(chaptersTable.seriesId, s.id)).orderBy(desc(chaptersTable.uploadDate)).limit(1);
      return { ...s, genres: genreRows, _count: { chapters: Number(chapterCount[0]?.count || 0) }, latestChapter: latestChapter[0] || null };
    }));
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/genres", async (_req: Request, res: Response) => {
  try {
    const genres = await db.select().from(genresTable).orderBy(asc(genresTable.name));
    res.json(genres);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const [series] = await db.select().from(seriesTable).where(eq(seriesTable.id, req.params.id)).limit(1);
    if (!series) { res.status(404).json({ error: "Series not found" }); return; }

    const [genreRows, chapters] = await Promise.all([
      db.select({ genre: { id: genresTable.id, name: genresTable.name } }).from(seriesGenresTable).innerJoin(genresTable, eq(seriesGenresTable.genreId, genresTable.id)).where(eq(seriesGenresTable.seriesId, series.id)),
      db.select().from(chaptersTable).where(eq(chaptersTable.seriesId, series.id)).orderBy(asc(chaptersTable.number)),
    ]);

    await db.update(seriesTable).set({ views: sql`${seriesTable.views} + 1` }).where(eq(seriesTable.id, series.id));

    res.json({ ...series, genres: genreRows, chapters });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { title, altTitle, description, cover, banner, author, artist, status, genres } = req.body;
    if (!title) { res.status(400).json({ error: "Title required" }); return; }

    const [series] = await db.insert(seriesTable).values({
      title, altTitle, description, cover, banner, author, artist,
      status: status || "ONGOING",
    }).returning();

    // Handle genres
    if (genres && Array.isArray(genres)) {
      for (const genreName of genres) {
        let [genre] = await db.select().from(genresTable).where(eq(genresTable.name, genreName)).limit(1);
        if (!genre) {
          [genre] = await db.insert(genresTable).values({ name: genreName }).returning();
        }
        await db.insert(seriesGenresTable).values({ seriesId: series.id, genreId: genre.id }).onConflictDoNothing();
      }
    }

    const genreRows = await db.select({ genre: { id: genresTable.id, name: genresTable.name } }).from(seriesGenresTable).innerJoin(genresTable, eq(seriesGenresTable.genreId, genresTable.id)).where(eq(seriesGenresTable.seriesId, series.id));
    res.status(201).json({ ...series, genres: genreRows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:id", authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { genres, ...data } = req.body;
    const [series] = await db.update(seriesTable).set({ ...data, updatedAt: new Date() }).where(eq(seriesTable.id, req.params.id)).returning();
    if (!series) { res.status(404).json({ error: "Series not found" }); return; }

    if (genres && Array.isArray(genres)) {
      await db.delete(seriesGenresTable).where(eq(seriesGenresTable.seriesId, series.id));
      for (const genreName of genres) {
        let [genre] = await db.select().from(genresTable).where(eq(genresTable.name, genreName)).limit(1);
        if (!genre) { [genre] = await db.insert(genresTable).values({ name: genreName }).returning(); }
        await db.insert(seriesGenresTable).values({ seriesId: series.id, genreId: genre.id }).onConflictDoNothing();
      }
    }

    const genreRows = await db.select({ genre: { id: genresTable.id, name: genresTable.name } }).from(seriesGenresTable).innerJoin(genresTable, eq(seriesGenresTable.genreId, genresTable.id)).where(eq(seriesGenresTable.seriesId, series.id));
    res.json({ ...series, genres: genreRows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    await db.delete(seriesTable).where(eq(seriesTable.id, req.params.id));
    res.status(204).end();
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
