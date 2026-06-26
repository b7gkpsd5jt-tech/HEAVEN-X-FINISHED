import { Router, Response } from "express";
import bcrypt from "bcrypt";
import { db } from "@workspace/db";
import { usersTable, refreshTokensTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../lib/jwt";
import { authenticate, AuthRequest } from "../lib/auth";

const router = Router();

router.post("/login", async (req: AuthRequest, res: Response) => {
  try {
    const { username, password, rememberMe, deviceId } = req.body;
    if (!username || !password) {
      res.status(400).json({ error: "Username and password required" });
      return;
    }

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.username, username.toLowerCase().trim()))
      .limit(1);

    if (!user || !user.isActive) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    // Device lock check
    if (deviceId && user.deviceLockMode !== "UNLIMITED") {
      if (user.deviceId && user.deviceId !== deviceId) {
        if (user.deviceLockMode === "TWO") {
          if (user.deviceId2 && user.deviceId2 !== deviceId) {
            res.status(403).json({
              error: "این اطلاعات قبلاً به نام شخص دیگری ثبت شده است، در صورت ادامه تلاش، دسترسی به این اطلاعات مسدود خواهد شد",
              deviceLocked: true,
            });
            return;
          } else if (!user.deviceId2) {
            await db.update(usersTable).set({ deviceId2: deviceId }).where(eq(usersTable.id, user.id));
          }
        } else {
          res.status(403).json({
            error: "این اطلاعات قبلاً به نام شخص دیگری ثبت شده است، در صورت ادامه تلاش، دسترسی به این اطلاعات مسدود خواهد شد",
            deviceLocked: true,
          });
          return;
        }
      } else if (!user.deviceId) {
        await db.update(usersTable).set({ deviceId }).where(eq(usersTable.id, user.id));
      }
    }

    const tokenPayload = { userId: user.id, username: user.username, role: user.role };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await db.insert(refreshTokensTable).values({ token: refreshToken, userId: user.id, expiresAt });
    await db.update(usersTable).set({ lastLoginAt: new Date() }).where(eq(usersTable.id, user.id));

    const maxAge = rememberMe ? 7 * 24 * 60 * 60 * 1000 : 15 * 60 * 1000;
    res.cookie("access_token", accessToken, { httpOnly: true, maxAge, sameSite: "lax" });
    res.cookie("refresh_token", refreshToken, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000, sameSite: "lax" });

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        language: user.language,
        readMode: user.readMode,
        darkMode: user.darkMode,
        deviceLockMode: user.deviceLockMode,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
      },
      accessToken,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/logout", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const refreshToken = (req as any).cookies?.refresh_token;
    if (refreshToken) {
      await db.delete(refreshTokensTable).where(eq(refreshTokensTable.token, refreshToken));
    }
    res.clearCookie("access_token");
    res.clearCookie("refresh_token");
    res.json({ message: "Logged out" });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/me", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId)).limit(1);
    if (!user) { res.status(404).json({ error: "User not found" }); return; }
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      language: user.language,
      readMode: user.readMode,
      darkMode: user.darkMode,
      deviceLockMode: user.deviceLockMode,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/refresh", async (req: AuthRequest, res: Response) => {
  try {
    const refreshToken = (req as any).cookies?.refresh_token || req.body.refreshToken;
    if (!refreshToken) { res.status(401).json({ error: "No refresh token" }); return; }

    const [tokenRecord] = await db.select().from(refreshTokensTable).where(eq(refreshTokensTable.token, refreshToken)).limit(1);
    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      res.status(401).json({ error: "Invalid refresh token" });
      return;
    }

    const payload = verifyRefreshToken(refreshToken);
    const accessToken = generateAccessToken({ userId: payload.userId, username: payload.username, role: payload.role });

    res.cookie("access_token", accessToken, { httpOnly: true, maxAge: 15 * 60 * 1000, sameSite: "lax" });
    res.json({ accessToken });
  } catch {
    res.status(401).json({ error: "Invalid refresh token" });
  }
});

export default router;
