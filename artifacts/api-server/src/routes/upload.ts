import { Router, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import AdmZip from "adm-zip";
import { db } from "@workspace/db";
import { chaptersTable, chapterPagesTable, seriesTable, siteSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authenticate, requireAdmin, AuthRequest } from "../lib/auth";

const router = Router();

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";
const MAX_SIZE = parseInt(process.env.MAX_UPLOAD_SIZE || "209715200"); // 200MB
const ALLOWED_IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".webp"];

// Ensure upload dirs exist
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `upload-${unique}${path.extname(file.originalname).toLowerCase()}`);
  },
});

const upload = multer({ storage, limits: { fileSize: MAX_SIZE } });

router.get("/zip/status", (_req, res) => {
  res.json({ maxFileSize: MAX_SIZE, allowedFormats: ALLOWED_IMAGE_EXTS });
});

// ZIP chapter upload
router.post("/zip", authenticate, requireAdmin, upload.single("file"), async (req: AuthRequest, res: Response) => {
  if (!req.file) { res.status(400).json({ error: "No file received — check FormData field name is 'file'" }); return; }
  const { seriesId, chapterNumber, chapterTitle } = req.body;
  if (!seriesId || !chapterNumber) {
    fs.unlinkSync(req.file.path);
    res.status(400).json({ error: "seriesId and chapterNumber required" });
    return;
  }

  const chapterNum = parseInt(chapterNumber);
  if (isNaN(chapterNum) || chapterNum < 1) {
    fs.unlinkSync(req.file.path);
    res.status(400).json({ error: "Invalid chapter number" });
    return;
  }

  try {
    const [series] = await db.select().from(seriesTable).where(eq(seriesTable.id, seriesId)).limit(1);
    if (!series) { fs.unlinkSync(req.file.path); res.status(404).json({ error: "Series not found" }); return; }

    const zip = new AdmZip(req.file.path);
    const zipEntries = zip.getEntries()
      .filter(e => !e.isDirectory && ALLOWED_IMAGE_EXTS.includes(path.extname(e.entryName).toLowerCase()))
      .sort((a, b) => a.entryName.localeCompare(b.entryName, undefined, { numeric: true, sensitivity: "base" }));

    if (zipEntries.length === 0) {
      fs.unlinkSync(req.file.path);
      res.status(400).json({ error: "No valid images found in ZIP" });
      return;
    }

    const safeTitle = series.title.replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, "_");
    const chapterDirName = `Chapter${String(chapterNum).padStart(3, "0")}`;
    const chapterDir = path.join(UPLOAD_DIR, safeTitle, chapterDirName);
    if (!fs.existsSync(chapterDir)) fs.mkdirSync(chapterDir, { recursive: true });

    const pageRecords: { pageNumber: number; filePath: string; fileName: string; order: number }[] = [];
    for (let i = 0; i < zipEntries.length; i++) {
      const entry = zipEntries[i];
      const ext = path.extname(entry.entryName).toLowerCase();
      const fileName = `${String(i + 1).padStart(3, "0")}${ext}`;
      const filePath = path.join(chapterDir, fileName);
      fs.writeFileSync(filePath, entry.getData());
      pageRecords.push({
        pageNumber: i + 1,
        filePath: `/uploads/${safeTitle}/${chapterDirName}/${fileName}`,
        fileName,
        order: i + 1,
      });
    }

    // Upsert chapter
    const existing = await db.select().from(chaptersTable).where(eq(chaptersTable.seriesId, seriesId)).then(r => r.find(c => c.number === chapterNum));

    let chapter;
    if (existing) {
      await db.delete(chapterPagesTable).where(eq(chapterPagesTable.chapterId, existing.id));
      [chapter] = await db.update(chaptersTable).set({ title: chapterTitle || `Chapter ${chapterNum}`, pageCount: pageRecords.length, updatedAt: new Date() }).where(eq(chaptersTable.id, existing.id)).returning();
      await db.insert(chapterPagesTable).values(pageRecords.map(p => ({ ...p, chapterId: existing.id })));
    } else {
      [chapter] = await db.insert(chaptersTable).values({ seriesId, number: chapterNum, title: chapterTitle || `Chapter ${chapterNum}`, sortOrder: chapterNum, pageCount: pageRecords.length }).returning();
      await db.insert(chapterPagesTable).values(pageRecords.map(p => ({ ...p, chapterId: chapter.id })));
    }

    await db.update(seriesTable).set({ updatedAt: new Date() }).where(eq(seriesTable.id, seriesId));
    fs.unlinkSync(req.file.path);

    res.status(201).json({ message: "Chapter uploaded successfully", chapterId: chapter.id, pageCount: pageRecords.length });
  } catch (err) {
    console.error(err);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: "Upload failed" });
  }
});

// Multi-image upload
router.post("/images", authenticate, requireAdmin, upload.array("images", 50), async (req: AuthRequest, res: Response) => {
  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) { res.status(400).json({ error: "No images received" }); return; }

  const { seriesId, chapterNumber, chapterTitle } = req.body;
  if (!seriesId || !chapterNumber) {
    files.forEach(f => fs.existsSync(f.path) && fs.unlinkSync(f.path));
    res.status(400).json({ error: "seriesId and chapterNumber required" });
    return;
  }

  const chapterNum = parseInt(chapterNumber);
  try {
    const [series] = await db.select().from(seriesTable).where(eq(seriesTable.id, seriesId)).limit(1);
    if (!series) {
      files.forEach(f => fs.existsSync(f.path) && fs.unlinkSync(f.path));
      res.status(404).json({ error: "Series not found" });
      return;
    }

    // Sort files by original filename
    const sortedFiles = [...files].sort((a, b) =>
      (a.originalname || a.filename).localeCompare(b.originalname || b.filename, undefined, { numeric: true, sensitivity: "base" })
    );

    const safeTitle = series.title.replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, "_");
    const chapterDirName = `Chapter${String(chapterNum).padStart(3, "0")}`;
    const chapterDir = path.join(UPLOAD_DIR, safeTitle, chapterDirName);
    if (!fs.existsSync(chapterDir)) fs.mkdirSync(chapterDir, { recursive: true });

    const pageRecords: { pageNumber: number; filePath: string; fileName: string; order: number }[] = [];
    for (let i = 0; i < sortedFiles.length; i++) {
      const file = sortedFiles[i];
      const ext = path.extname(file.originalname).toLowerCase();
      const fileName = `${String(i + 1).padStart(3, "0")}${ext}`;
      const destPath = path.join(chapterDir, fileName);
      fs.renameSync(file.path, destPath);
      pageRecords.push({
        pageNumber: i + 1,
        filePath: `/uploads/${safeTitle}/${chapterDirName}/${fileName}`,
        fileName,
        order: i + 1,
      });
    }

    const existing = await db.select().from(chaptersTable).where(eq(chaptersTable.seriesId, seriesId)).then(r => r.find(c => c.number === chapterNum));
    let chapter;
    if (existing) {
      await db.delete(chapterPagesTable).where(eq(chapterPagesTable.chapterId, existing.id));
      [chapter] = await db.update(chaptersTable).set({ title: chapterTitle || `Chapter ${chapterNum}`, pageCount: pageRecords.length, updatedAt: new Date() }).where(eq(chaptersTable.id, existing.id)).returning();
      await db.insert(chapterPagesTable).values(pageRecords.map(p => ({ ...p, chapterId: existing.id })));
    } else {
      [chapter] = await db.insert(chaptersTable).values({ seriesId, number: chapterNum, title: chapterTitle || `Chapter ${chapterNum}`, sortOrder: chapterNum, pageCount: pageRecords.length }).returning();
      await db.insert(chapterPagesTable).values(pageRecords.map(p => ({ ...p, chapterId: chapter.id })));
    }

    await db.update(seriesTable).set({ updatedAt: new Date() }).where(eq(seriesTable.id, seriesId));
    res.status(201).json({ message: "Chapter uploaded successfully", chapterId: chapter.id, pageCount: pageRecords.length });
  } catch (err) {
    console.error(err);
    files.forEach(f => fs.existsSync(f.path) && fs.unlinkSync(f.path));
    res.status(500).json({ error: "Upload failed" });
  }
});

// Cover upload
router.post("/cover", authenticate, requireAdmin, upload.single("cover"), async (req: AuthRequest, res: Response) => {
  if (!req.file) { res.status(400).json({ error: "No cover image received" }); return; }
  const { seriesId } = req.body;
  if (!seriesId) { fs.unlinkSync(req.file.path); res.status(400).json({ error: "seriesId required" }); return; }

  try {
    const coverUrl = `/uploads/${path.basename(req.file.path)}`;
    await db.update(seriesTable).set({ cover: coverUrl, updatedAt: new Date() }).where(eq(seriesTable.id, seriesId));
    res.json({ url: coverUrl });
  } catch {
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: "Upload failed" });
  }
});

// Banner upload
router.post("/banner", authenticate, requireAdmin, upload.single("banner"), async (req: AuthRequest, res: Response) => {
  if (!req.file) { res.status(400).json({ error: "No banner image received" }); return; }
  try {
    const bannerUrl = `/uploads/${path.basename(req.file.path)}`;
    const existing = await db.select().from(siteSettingsTable).limit(1);
    if (existing.length > 0) {
      await db.update(siteSettingsTable).set({ bannerUrl, updatedAt: new Date() });
    } else {
      await db.insert(siteSettingsTable).values({ bannerUrl });
    }
    res.json({ url: bannerUrl });
  } catch {
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: "Upload failed" });
  }
});

export default router;
