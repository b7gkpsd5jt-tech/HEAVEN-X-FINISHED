import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "./jwt";

export interface AuthRequest extends Request {
  user?: { userId: string; username: string; role: string };
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const cookieToken = (req as any).cookies?.access_token;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : cookieToken;

  if (!token) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== "ADMIN") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  next();
}
