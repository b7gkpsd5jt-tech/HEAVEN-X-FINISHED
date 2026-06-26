import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "heavenx_secret_dev_key_change_in_production";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "heavenx_refresh_secret_dev_change_in_production";

export function generateAccessToken(payload: { userId: string; username: string; role: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "15m" });
}

export function generateRefreshToken(payload: { userId: string; username: string; role: string }): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: "7d" });
}

export function verifyAccessToken(token: string): { userId: string; username: string; role: string } {
  return jwt.verify(token, JWT_SECRET) as any;
}

export function verifyRefreshToken(token: string): { userId: string; username: string; role: string } {
  return jwt.verify(token, JWT_REFRESH_SECRET) as any;
}
