import { beforeEach, describe, expect, it, vi } from "vitest";
import bcrypt from "bcryptjs";
import { AuthResolver } from "./modules/auth.module";
import { RegistryResolver } from "./modules/registry.module";
import { DmsResolver, resetDmsState } from "./modules/dms.module";
import type { DatabaseService } from "./db/database.service";

describe("Portal workflow integration", () => {
  let auth: AuthResolver;
  let registry: RegistryResolver;
  let dms: DmsResolver;
  let assignments: Array<{ applicationSlug: string; userId: string }>;

  beforeEach(async () => {
    resetDmsState();
    assignments = [];
    const hash = await bcrypt.hash("admin123", 10);

    const database = {
      findUserByIdentifier: vi.fn().mockResolvedValue({
        id: "admin-id",
        email: "admin@moa.gov.et",
        username: "admin",
        fullName: "Administrator",
        passwordHash: hash,
        role: "admin",
        locale: "en",
      }),
      getUserAppSlugs: vi.fn().mockResolvedValue(["dms"]),
      createAuthSession: vi.fn().mockResolvedValue({ id: "session-1" }),
      listApplications: vi.fn().mockResolvedValue([]),
      registerApplication: vi.fn().mockImplementation(async (input: { slug: string }) => ({
        id: crypto.randomUUID(),
        ...input,
        isActive: true,
        assignedUsers: 0,
      })),
      assignUser: vi.fn().mockImplementation(async (slug: string, userId: string) => {
        assignments.push({ applicationSlug: slug, userId });
        return { id: "1", applicationSlug: slug, userId, assignedAt: new Date().toISOString() };
      }),
      listAssignmentsForSlug: vi.fn().mockImplementation(async (slug: string) =>
        assignments
          .filter((a) => a.applicationSlug === slug)
          .map((a, i) => ({
            id: String(i),
            applicationSlug: a.applicationSlug,
            userId: a.userId,
            assignedAt: new Date().toISOString(),
          })),
      ),
    } as unknown as DatabaseService;

    auth = new AuthResolver(database);
    registry = new RegistryResolver(database);
    dms = new DmsResolver();
  });

  it("logs in, provisions app access, and edits a document lifecycle", async () => {
    const login = await auth.login("admin@moa.gov.et", "admin123");
    expect(login.accessToken).toBeTypeOf("string");

    await registry.registerApplication(
      "livestock",
      "Livestock Tracker",
      "የእንስሳት ክትትል",
      "Track livestock records",
      "የእንስሳት መረጃ ክትትል",
      "/apps/livestock",
      false,
    );
    await registry.assignUser("livestock", "demo-user");

    const folder = dms.createFolder("Drafts", "root");
    const file = dms.createInlineDocument("Policy_Draft", folder.id);
    dms.checkoutFile(file.id, "demo-user");
    const checkedIn = dms.checkinFile(file.id, "demo-user");

    expect(checkedIn.version).toBe(2);
    expect((await registry.userAssignments("livestock")).some((entry) => entry.userId === "demo-user")).toBe(
      true,
    );
  });
});
