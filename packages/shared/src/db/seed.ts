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
  departments,
  userDepartments,
} from "./index.js";

const DEFAULT_DATABASE_URL = "postgres://moa:moa@localhost:5433/moa_portal";

const ALL_USERS = [
  // Admins
  { id: "00000000-0000-4000-8000-000000000001", email: "admin@moa.gov.et",           username: "admin",          fullName: "Abel Tadesse",       password: "admin123",      role: "admin",      deptSlug: "office-minister" },
  { id: "00000000-0000-4000-8000-000000000010", email: "dir.operations@moa.gov.et",  username: "dir.operations", fullName: "Meklit Haile",       password: "admin123",      role: "admin",      deptSlug: "operations" },
  { id: "00000000-0000-4000-8000-000000000011", email: "dir.it@moa.gov.et",           username: "dir.it",         fullName: "Samuel Bekele",      password: "admin123",      role: "admin",      deptSlug: "it" },
  // Supervisors
  { id: "00000000-0000-4000-8000-000000000003", email: "supervisor@moa.gov.et",       username: "supervisor",     fullName: "Field Supervisor",   password: "supervisor123", role: "supervisor", deptSlug: "extension-services" },
  { id: "00000000-0000-4000-8000-000000000012", email: "supervisor.oromia@moa.gov.et",username: "sup.oromia",     fullName: "Abayeneh Belachew",  password: "supervisor123", role: "supervisor", deptSlug: "oromia-regional" },
  { id: "00000000-0000-4000-8000-000000000013", email: "supervisor.snnpr@moa.gov.et", username: "sup.snnpr",      fullName: "Tigist Desta",       password: "supervisor123", role: "supervisor", deptSlug: "snnpr-regional" },
  // Regular users
  { id: "00000000-0000-4000-8000-000000000002", email: "user@moa.gov.et",             username: "portal.user",   fullName: "Demo User",          password: "user123",       role: "user",       deptSlug: "crop-production" },
  { id: "00000000-0000-4000-8000-000000000004", email: "farmer.joe@moa.gov.et",       username: "farmer.joe",    fullName: "Farmer Joe",         password: "admin123",      role: "user",       deptSlug: "crop-production" },
  { id: "00000000-0000-4000-8000-000000000005", email: "field.worker@moa.gov.et",     username: "field.worker",  fullName: "Field Worker",       password: "user123",       role: "user",       deptSlug: "extension-services" },
  { id: "00000000-0000-4000-8000-000000000014", email: "extension.agent@moa.gov.et",  username: "ext.agent",     fullName: "Nahome Zeleke",      password: "user123",       role: "user",       deptSlug: "extension-services" },
  { id: "00000000-0000-4000-8000-000000000015", email: "data.analyst@moa.gov.et",     username: "data.analyst",  fullName: "Marta Girma",        password: "user123",       role: "user",       deptSlug: "planning-mne" },
];

// Ministry of Agriculture – core departments
const DEPARTMENTS = [
  { id: "00000000-0000-4000-9000-000000000001", slug: "office-minister",    nameEn: "Office of the Minister",              nameAm: "የሚኒስትሩ ጽ/ቤት" },
  { id: "00000000-0000-4000-9000-000000000002", slug: "crop-production",    nameEn: "Crop Production & Natural Resources",  nameAm: "ሰብል ምርትና ተፈጥሮ ሀብት" },
  { id: "00000000-0000-4000-9000-000000000003", slug: "extension-services", nameEn: "Agricultural Extension Services",      nameAm: "የግብርና ኤክስቴንሽን አገልግሎት" },
  { id: "00000000-0000-4000-9000-000000000004", slug: "planning-mne",       nameEn: "Planning, M&E and Statistics",         nameAm: "ፕላን፣ ክትትልና ስታቲስቲክስ" },
  { id: "00000000-0000-4000-9000-000000000005", slug: "it",                 nameEn: "Information Technology",               nameAm: "መረጃ ቴክኖሎጂ" },
  { id: "00000000-0000-4000-9000-000000000006", slug: "operations",         nameEn: "Operations & Finance",                 nameAm: "ስራ አሰተዳደርና ፋይናንስ" },
  { id: "00000000-0000-4000-9000-000000000007", slug: "oromia-regional",    nameEn: "Oromia Regional Office",               nameAm: "ኦሮሚያ ክልላዊ ጽ/ቤት" },
  { id: "00000000-0000-4000-9000-000000000008", slug: "snnpr-regional",     nameEn: "SNNPR Regional Office",                nameAm: "ደቡብ ብሔሮች ክልላዊ ጽ/ቤት" },
];

const APPS = [
  { id: "00000000-0000-4000-8000-000000000010", slug: "dms",       nameEn: "Document Management",  nameAm: "የሰነድ አስተዳደር",   descriptionEn: "Ministry document workspace",       descriptionAm: "የሚኒስቴሩ የሰነድ ስራ ቦታ",              routePath: "/apps/dms" },
  { id: "00000000-0000-4000-8000-000000000011", slug: "livestock", nameEn: "Livestock Tracking",   nameAm: "የእንስሳት ክትትል",   descriptionEn: "Track national livestock health",   descriptionAm: "የሀገር አቀፍ የእንስሳት ጤና ክትትል",          routePath: "/apps/livestock" },
];

const GROUP_ROOMS = [
  { name: "Crop Monitoring Team",       type: "group",   description: "Discuss crop health and yield data across regions" },
  { name: "Fertilizer Distribution",    type: "group",   description: "Coordinate fertilizer supply chain and logistics" },
  { name: "MOA Announcements",          type: "channel", description: "Official ministry-wide broadcast channel" },
  { name: "Regional Updates - Oromia", type: "channel", description: "Field reports from Oromia region" },
];

export async function seedDatabase(connectionString = process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL) {
  const { db, pool } = createDb(connectionString);

  // ── 1. Hash passwords ──────────────────────────────────────────────────────
  const passwordHashes = new Map<string, string>();
  for (const u of ALL_USERS) {
    if (!passwordHashes.has(u.password)) {
      passwordHashes.set(u.password, await bcrypt.hash(u.password, 10));
    }
  }

  // ── 2. Users ───────────────────────────────────────────────────────────────
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
      })),
    )
    .onConflictDoNothing();

  // ── 3. Applications ────────────────────────────────────────────────────────
  await db
    .insert(applications)
    .values(
      APPS.map((a) => ({
        id: a.id, slug: a.slug, nameEn: a.nameEn, nameAm: a.nameAm,
        descriptionEn: a.descriptionEn, descriptionAm: a.descriptionAm,
        routePath: a.routePath, isActive: true, searchEnabled: true, sidebarOrder: 1,
      })),
    )
    .onConflictDoNothing();

  // Assign DMS to everyone, Livestock to non-admins
  for (const u of ALL_USERS) {
    const [existingDms] = await db.select().from(userApplications)
      .where(and(eq(userApplications.userId, u.id), eq(userApplications.applicationId, APPS[0].id))).limit(1);
    if (!existingDms) await db.insert(userApplications).values({ userId: u.id, applicationId: APPS[0].id });
  }
  for (const u of ALL_USERS.filter((u) => u.role !== "admin")) {
    const [existing] = await db.select().from(userApplications)
      .where(and(eq(userApplications.userId, u.id), eq(userApplications.applicationId, APPS[1].id))).limit(1);
    if (!existing) await db.insert(userApplications).values({ userId: u.id, applicationId: APPS[1].id });
  }

  // ── 4. MOA Departments ─────────────────────────────────────────────────────
  await db.insert(departments)
    .values(DEPARTMENTS.map((d) => ({ id: d.id, slug: d.slug, nameEn: d.nameEn, nameAm: d.nameAm, isActive: true })))
    .onConflictDoNothing();

  // ── 5. Department chat rooms (system, auto-managed) ───────────────────────
  // One system group room per department
  const adminId = "00000000-0000-4000-8000-000000000001";
  const deptRoomMap = new Map<string, string>(); // deptId → roomId

  for (const dept of DEPARTMENTS) {
    const [existing] = await db.select().from(chatRooms)
      .where(and(eq(chatRooms.isSystem, true), eq(chatRooms.systemType, "department"), eq(chatRooms.departmentId, dept.id)))
      .limit(1);

    if (existing) {
      deptRoomMap.set(dept.id, existing.id);
    } else {
      const [room] = await db.insert(chatRooms).values({
        name: `Department: ${dept.nameEn}`,
        type: "group",
        description: `Department group for ${dept.nameEn} – auto-managed`,
        isSystem: true,
        systemType: "department",
        departmentId: dept.id,
        createdBy: adminId,
      } as any).returning();
      if (room) deptRoomMap.set(dept.id, room.id);
    }
  }

  // ── 6. Assign every user to their department & add to dept room ───────────
  const deptBySlug = new Map(DEPARTMENTS.map((d) => [d.slug, d]));

  for (const u of ALL_USERS) {
    const dept = deptBySlug.get(u.deptSlug);
    if (!dept) continue;

    // Upsert user_department record
    await db.insert(userDepartments)
      .values({ userId: u.id, departmentId: dept.id, assignedBy: adminId })
      .onConflictDoNothing();

    // Add user to the department's system chat room
    const roomId = deptRoomMap.get(dept.id);
    if (roomId) {
      const memberRole = u.role === "admin" ? "admin" : "member";
      await db.insert(chatRoomMembers)
        .values({ roomId, userId: u.id, role: memberRole })
        .onConflictDoNothing();
    }
  }

  // ── 7. General group/channel rooms ────────────────────────────────────────
  for (const g of GROUP_ROOMS) {
    const [existing] = await db.select().from(chatRooms).where(eq(chatRooms.name, g.name)).limit(1);
    if (existing) continue;

    const [room] = await db.insert(chatRooms)
      .values({ name: g.name, type: g.type, description: g.description, createdBy: adminId, avatarUrl: `https://i.pravatar.cc/150?u=${g.name}` })
      .returning();
    if (!room) continue;

    await db.insert(chatRoomMembers).values({ roomId: room.id, userId: adminId, role: "admin" }).onConflictDoNothing();
    const others = ALL_USERS.filter((u) => u.id !== adminId).sort(() => 0.5 - Math.random()).slice(0, 4);
    for (const m of others) {
      await db.insert(chatRoomMembers).values({ roomId: room.id, userId: m.id, role: "member" }).onConflictDoNothing();
    }
  }

  // ── 8. Announcements ──────────────────────────────────────────────────────
  const announcementCount = await db.select().from(portalAnnouncements).limit(1);
  if (announcementCount.length === 0) {
    await db.insert(portalAnnouncements).values([
      { titleEn: "Rainy season advisory",      titleAm: "የዝናብ ወቅት ማስጠንቀቂያ",    bodyEn: "Extension agents should coordinate soil moisture monitoring across highland regions.", bodyAm: "የማስረጃ ወኪሎች በሰፊው ቦታዎች የአፈር እርጥበት ክትትል እንዲያደርጉ ይጠየቃሉ።" },
      { titleEn: "Fertilizer subsidy extension", titleAm: "የማዳበሪያ ድጎማ ተራዘመ", bodyEn: "The national fertilizer subsidy window has been extended through Q2.",                bodyAm: "የሀገር አቀፍ የማዳበሪያ ድጎማ መስክ ለሁለተኛ ሩብ ዘመን ተራዝሟል።" },
    ]);
  }

  // ── 9. Audit log ──────────────────────────────────────────────────────────
  const [adminUser] = await db.select().from(users).where(eq(users.email, "admin@moa.gov.et")).limit(1);
  if (adminUser) {
    const auditCount = await db.select().from(auditLogs).limit(1);
    if (auditCount.length === 0) {
      await db.insert(auditLogs).values({
        actorUserId: adminUser.id, action: "SEED_COMPLETE", targetType: "system", targetId: "database",
        details: { message: "Portal seeded: 11 users, 8 departments, department chat rooms auto-created" },
      });
    }
  }

  await pool.end();
}
