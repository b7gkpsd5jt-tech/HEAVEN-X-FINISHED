import app from "./app";
import { logger } from "./lib/logger";
import bcrypt from "bcrypt";
import { db } from "@workspace/db";
import { popupsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const DEFAULT_POPUP_ID = "welcome-default";

async function seedAdminUser() {
  const adminUsername = process.env["ADMIN_USERNAME"];
  const adminPassword = process.env["ADMIN_PASSWORD"];
  if (!adminUsername || !adminPassword) return;

  try {
    const existing = await db.select().from(usersTable).where(eq(usersTable.username, adminUsername.toLowerCase())).limit(1);
    if (existing.length === 0) {
      const hashed = await bcrypt.hash(adminPassword, 12);
      await db.insert(usersTable).values({
        username: adminUsername.toLowerCase(),
        password: hashed,
        role: "ADMIN",
        language: "DE",
        isActive: true,
      });
      logger.info({ username: adminUsername }, "Admin user seeded from env");
    }
  } catch (err) {
    logger.error({ err }, "Failed to seed admin user");
  }
}

async function seedDefaultPopup() {
  try {
    const existing = await db.select().from(popupsTable).where(eq(popupsTable.id, DEFAULT_POPUP_ID));
    if (existing.length === 0) {
      await db.insert(popupsTable).values({
        id: DEFAULT_POPUP_ID,
        title: "به بهشت منهوا خوش آمدید",
        content: `تمام آثار داخل سایت قرار می‌گیرند. این سایت عمومی نیست و فقط کاربران مجاز می‌توانند وارد شوند.\n\nدسترسی به سایت فقط از طریق نام کاربری و رمز عبور شخصی امکان‌پذیر است و هر فرد حساب مخصوص به خود را دارد.\n\nبرای دسترسی به سایت هیچ‌گونه پرداختی نیاز نیست. این محدودیت فقط به دلایل امنیتی و جلوگیری از سوءاستفاده و انتشار غیرمجاز اعمال شده است در صورت نیاز به دریافت دسترسی یا اطلاعات بیشتر، لطفاً عضو کانال تلگرامی ما شوید`,
        buttonText: "کانال تلگرام",
        buttonUrl: "https://t.me/heavenxmanh",
        closeText: "متوجه شدم",
        isEnabled: true,
        displayDurationHours: null,
      });
      logger.info("Default welcome popup seeded");
    }
  } catch (err) {
    logger.error({ err }, "Failed to seed default popup");
  }
}

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
  seedAdminUser();
  seedDefaultPopup();
});
