import { db } from "./index";
import { usersTable } from "./schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

async function seed() {
  const adminUsername = (process.env.ADMIN_USERNAME || "DEXTER").toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || "Hamid4747";

  const existing = await db.select().from(usersTable).where(eq(usersTable.username, adminUsername)).limit(1);
  if (existing.length > 0) {
    console.log(`Admin user '${adminUsername}' already exists`);
    return;
  }

  const hashed = await bcrypt.hash(adminPassword, 12);
  await db.insert(usersTable).values({
    username: adminUsername,
    password: hashed,
    role: "ADMIN",
    isActive: true,
    deviceLockMode: "UNLIMITED",
  });

  console.log(`✅ Admin user '${adminUsername}' created`);

  // Seed Telegram social link
  const { socialLinksTable } = await import("./schema");
  const existingSocial = await db.select().from(socialLinksTable).limit(1);
  if (existingSocial.length === 0) {
    await db.insert(socialLinksTable).values({
      platform: "telegram",
      url: "https://t.me/heavenxmanh",
      label: "Telegram",
      isEnabled: true,
      sortOrder: 0,
    });
    console.log("✅ Telegram link seeded");
  }
}

seed().catch(console.error).finally(() => process.exit(0));
