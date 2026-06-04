import { beforeEach, describe, expect, it, vi } from "vitest";
import { RegistryResolver } from "./registry.module";
import type { DatabaseService } from "../db/database.service";

describe("RegistryResolver", () => {
  let resolver: RegistryResolver;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let apps: any[];
  let assignments: Array<{ id: string; applicationSlug: string; userId: string; assignedAt: string }>;
  let users: Array<{ id: string; email: string; username: string; fullName: string; role: string }>;

  beforeEach(() => {
    apps = [
      {
        id: "1",
        slug: "dms",
        nameEn: "Document Management",
        nameAm: "የሰነድ አስተዳደር",
        descriptionEn: "desc",
        descriptionAm: "desc",
        routePath: "/apps/dms",
        isActive: true,
        searchEnabled: true,
        assignedUsers: 0,
      },
    ];
    assignments = [];
    users = [{ id: "admin-user", email: "admin@moa.gov.et", username: "admin", fullName: "Administrator", role: "admin" }];

    const database = {
      listApplications: vi.fn(async () => apps),
      listAssignmentsForSlug: vi.fn(async (slug: string) =>
        assignments.filter((a) => a.applicationSlug === slug),
      ),
      listUsers: vi.fn(async () => users),
      getUserAppSlugs: vi.fn(async () => ["dms"]),
      listAuditLogs: vi.fn(async () => []),
      registerApplication: vi.fn(async (input) => {
        const created = {
          id: crypto.randomUUID(),
          ...input,
          isActive: true,
          assignedUsers: 0,
        };
        apps.push(created as (typeof apps)[number]);
        return created;
      }),
      toggleApplication: vi.fn(async (slug: string, isActive: boolean) => {
        const app = apps.find((a) => a.slug === slug);
        if (app) app.isActive = isActive;
        return Boolean(app);
      }),
      assignUser: vi.fn(async (slug: string, userId: string) => {
        const row = {
          id: crypto.randomUUID(),
          applicationSlug: slug,
          userId,
          assignedAt: new Date().toISOString(),
        };
        assignments.push(row);
        return row;
      }),
      revokeUser: vi.fn(async (slug: string, userId: string) => {
        const index = assignments.findIndex((a) => a.applicationSlug === slug && a.userId === userId);
        if (index >= 0) assignments.splice(index, 1);
        return index >= 0;
      }),
    } as unknown as DatabaseService;

    resolver = new RegistryResolver(database);
  });

  it("registers a new application", async () => {
    const app = await resolver.registerApplication(
      "crop-monitor",
      "Crop Monitor",
      "የሰብል ክትትል",
      "Crop insights",
      "የሰብል መረጃ",
      "/apps/crop-monitor",
      true,
    );

    expect(app.slug).toBe("crop-monitor");
    const list = await resolver.applications();
    expect(list.some((entry) => entry.slug === "crop-monitor")).toBe(true);
  });

  it("assigns and revokes users", async () => {
    const assignment = await resolver.assignUser("dms", "worker-1");
    expect(assignment.userId).toBe("worker-1");
    expect((await resolver.userAssignments("dms")).some((entry) => entry.userId === "worker-1")).toBe(true);

    expect(await resolver.revokeUser("dms", "worker-1")).toBe(true);
    expect((await resolver.userAssignments("dms")).some((entry) => entry.userId === "worker-1")).toBe(false);
  });

  it("returns portal users for assignment UI", async () => {
    const portalUsers = await resolver.portalUsers();
    expect(portalUsers.length).toBeGreaterThan(0);
    expect(portalUsers.some((entry) => entry.id === "admin-user")).toBe(true);
  });
});
