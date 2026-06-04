import bcrypt from "bcryptjs";
import { and, eq } from "drizzle-orm";
import { createDb } from "./client.js";
import {
  applications,
  auditLogs,
  portalAnnouncements,
  userApplications,
  users,
  chatRooms,
  chatRoomMembers,
} from "./index.js";

const DEFAULT_DATABASE_URL = "postgres://moa:moa@localhost:5433/moa_portal";

const ALL_USERS = [
  // 3 Admins
  { id: "00000000-0000-4000-8000-000000000001", email: "admin@moa.gov.et", username: "admin", fullName: "Abel Tadesse", password: "admin123", role: "admin" },
  { id: "00000000-0000-4000-8000-000000000010", email: "dir.operations@moa.gov.et", username: "dir.operations", fullName: "Meklit Haile", password: "admin123", role: "admin" },
  { id: "00000000-0000-4000-8000-000000000011", email: "dir.it@moa.gov.et", username: "dir.it", fullName: "Samuel Bekele", password: "admin123", role: "admin" },
  // 3 Supervisors
  { id: "00000000-0000-4000-8000-000000000003", email: "supervisor@moa.gov.et", username: "supervisor", fullName: "Field Supervisor", password: "supervisor123", role: "supervisor" },
  { id: "00000000-0000-4000-8000-000000000012", email: "supervisor.oromia@moa.gov.et", username: "sup.oromia", fullName: "Abayeneh Belachew", password: "supervisor123", role: "supervisor" },
  { id: "00000000-0000-4000-8000-000000000013", email: "supervisor.snnpr@moa.gov.et", username: "sup.snnpr", fullName: "Tigist Desta", password: "supervisor123", role: "supervisor" },
  // 3 Regular Users
  { id: "00000000-0000-4000-8000-000000000002", email: "user@moa.gov.et", username: "portal.user", fullName: "Demo User", password: "user123", role: "user" },
  { id: "00000000-0000-4000-8000-000000000004", email: "farmer.joe@moa.gov.et", username: "farmer.joe", fullName: "Farmer Joe", password: "admin123", role: "user" },
  { id: "00000000-0000-4000-8000-000000000005", email: "field.worker@moa.gov.et", username: "field.worker", fullName: "Field Worker", password: "user123", role: "user" },
  { id: "00000000-0000-4000-8000-000000000014", email: "extension.agent@moa.gov.et", username: "ext.agent", fullName: "Nahome Zeleke", password: "user123", role: "user" },
  { id: "00000000-0000-4000-8000-000000000015", email: "data.analyst@moa.gov.et", username: "data.analyst", fullName: "Marta Girma", password: "user123", role: "user" },
];

const APPS = [
  { id: "00000000-0000-4000-8000-000000000010", slug: "dms", nameEn: "Document Management", nameAm: "የሰነድ አስተዳደር", descriptionEn: "Ministry document workspace", descriptionAm: "የሚኒስቴሩ የሰነድ ስራ ቦታ", routePath: "/apps/dms" },
  { id: "00000000-0000-4000-8000-000000000011", slug: "livestock", nameEn: "Livestock Tracking", nameAm: "የእንስሳት ክትትል", descriptionEn: "Track national livestock health", descriptionAm: "የሀገር አቀፍ የእንስሳት ጤና ክትትል", routePath: "/apps/livestock" },
];

const GROUP_ROOMS = [
  { name: "Crop Monitoring Team", type: "group", description: "Discuss crop health and yield data across regions" },
  { name: "Fertilizer Distribution", type: "group", description: "Coordinate fertilizer supply chain and logistics" },
  { name: "MOA Announcements", type: "channel", description: "Official ministry-wide broadcast channel" },
  { name: "Regional Updates - Oromia", type: "channel", description: "Field reports from Oromia region" },
];

export async function seedDatabase(connectionString = process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL) {
  const { db, pool } = createDb(connectionString);

  // Hash all user passwords
  const passwordHashes = new Map<string, string>();
  for (const u of ALL_USERS) {
    if (!passwordHashes.has(u.password)) {
      passwordHashes.set(u.password, await bcrypt.hash(u.password, 10));
    }
  }

  // Insert users
  await db
    .insert(users)
    .values(
      ALL_USERS.map((u) => ({
        id: u.id,
        email: u.email,
        username: u.username,
        fullName: u.fullName,
        passwordHash: passwordHashes.get(u.password)!,
        role: u.role,
        locale: "en",
      }))
    )
    .onConflictDoNothing();

  // Insert apps
  await db
    .insert(applications)
    .values(
      APPS.map((a) => ({
        id: a.id,
        slug: a.slug,
        nameEn: a.nameEn,
        nameAm: a.nameAm,
        descriptionEn: a.descriptionEn,
        descriptionAm: a.descriptionAm,
        routePath: a.routePath,
        isActive: true,
        searchEnabled: true,
        sidebarOrder: 1,
      }))
    )
    .onConflictDoNothing();

  // Assign DMS to all users
  for (const u of ALL_USERS) {
    const [existingDms] = await db
      .select()
      .from(userApplications)
      .where(and(eq(userApplications.userId, u.id), eq(userApplications.applicationId, APPS[0].id)))
      .limit(1);
    if (!existingDms) {
      await db.insert(userApplications).values({ userId: u.id, applicationId: APPS[0].id });
    }
  }

  // Assign Livestock to non-admins
  for (const u of ALL_USERS.filter((u) => u.role !== "admin")) {
    const [existing] = await db
      .select()
      .from(userApplications)
      .where(and(eq(userApplications.userId, u.id), eq(userApplications.applicationId, APPS[1].id)))
      .limit(1);
    if (!existing) {
      await db.insert(userApplications).values({ userId: u.id, applicationId: APPS[1].id });
    }
  }

  // Create seed group rooms (each room gets 3-4 random members)
  for (const g of GROUP_ROOMS) {
    const [existing] = await db.select().from(chatRooms).where(eq(chatRooms.name, g.name)).limit(1);
    if (existing) continue;

    const adminUser = ALL_USERS.find((u) => u.role === "admin")!;
    const [room] = await db
      .insert(chatRooms)
      .values({ name: g.name, type: g.type, description: g.description, createdBy: adminUser.id, avatarUrl: `https://i.pravatar.cc/150?u=${g.name}` })
      .returning();

    if (!room) continue;

    // Add creator as admin
    await db.insert(chatRoomMembers).values({ roomId: room.id, userId: adminUser.id, role: "admin" }).onConflictDoNothing();

    // Add 3-4 random members
    const others = ALL_USERS.filter((u) => u.id !== adminUser.id).sort(() => 0.5 - Math.random()).slice(0, 4);
    for (const m of others) {
      await db.insert(chatRoomMembers).values({ roomId: room.id, userId: m.id, role: "member" }).onConflictDoNothing();
    }
  }

  // Announcements
  const announcementCount = await db.select().from(portalAnnouncements).limit(1);
  if (announcementCount.length === 0) {
    await db.insert(portalAnnouncements).values([
      { titleEn: "Rainy season advisory", titleAm: "የዝናብ ወቅት ማስጠንቀቂያ", bodyEn: "Extension agents should coordinate soil moisture monitoring across highland regions.", bodyAm: "የማስረጃ ወኪሎች በሰፊው ቦታዎች የአፈር እርጥበት ክትትል እንዲያደርጉ ይጠየቃሉ።" },
      { titleEn: "Fertilizer subsidy extension", titleAm: "የማዳበሪያ ድጎማ ተራዘመ", bodyEn: "The national fertilizer subsidy window has been extended through Q2.", bodyAm: "የሀገር አቀፍ የማዳበሪያ ድጎማ መስክ ለሁለተኛ ሩብ ዘመን ተራዝሟል።" },
    ]);
  }

  // Audit log
  const [adminUser] = await db.select().from(users).where(eq(users.email, "admin@moa.gov.et")).limit(1);
  if (adminUser) {
    const auditCount = await db.select().from(auditLogs).limit(1);
    if (auditCount.length === 0) {
      await db.insert(auditLogs).values({ actorUserId: adminUser.id, action: "SEED_COMPLETE", targetType: "system", targetId: "database", details: { message: "Portal seed with 12 users and 4 rooms" } });
    }
  }

  await pool.end();
}
