import { describe, expect, it, vi } from "vitest";
import { createHash } from "crypto";
import bcrypt from "bcryptjs";
import { AuthResolver } from "./auth.module";
import type { DatabaseService } from "../db/database.service";

describe("AuthResolver", () => {
  it("returns auth tokens for valid credentials", async () => {
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
    } as unknown as DatabaseService;

    const resolver = new AuthResolver(database);
    const result = await resolver.login("admin@moa.gov.et", "admin123");
    expect(result.accessToken).toBeTypeOf("string");
    expect(result.refreshToken).toBeTypeOf("string");
    expect(result.accessToken.length).toBeGreaterThan(20);
  });

  it("throws for invalid credentials", async () => {
    const database = {
      findUserByIdentifier: vi.fn().mockResolvedValue(null),
    } as unknown as DatabaseService;

    const resolver = new AuthResolver(database);
    await expect(resolver.login("admin@moa.gov.et", "wrong")).rejects.toThrow();
  });

  it("rejects duplicate usernames during signup", async () => {
    const database = {
      findUserByEmail: vi.fn().mockResolvedValue(null),
      findUserByUsername: vi.fn().mockResolvedValue({ id: "u-1" }),
    } as unknown as DatabaseService;

    const resolver = new AuthResolver(database);
    await expect(
      resolver.signup("new@moa.gov.et", "admin", "Password1!", "New User", "en"),
    ).rejects.toThrow("Username already exists");
  });

  it("rotates refresh tokens for an active session", async () => {
    const { signRefreshToken } = await import("@moa/shared/auth");
    const refreshToken = await signRefreshToken(
      {
        sub: "admin-id",
        email: "admin@moa.gov.et",
        username: "admin",
        roles: ["admin"],
        sessionId: "session-1",
      },
      process.env.JWT_SECRET ?? "replace_me",
    );

    const rotateAuthSession = vi.fn().mockResolvedValue({ id: "session-1" });
    const database = {
      findActiveAuthSession: vi.fn().mockResolvedValue({
        id: "session-1",
        userId: "admin-id",
        refreshTokenHash: createHash("sha256").update(refreshToken).digest("hex"),
      }),
      findUserById: vi.fn().mockResolvedValue({
        id: "admin-id",
        email: "admin@moa.gov.et",
        username: "admin",
        fullName: "Administrator",
        role: "admin",
      }),
      getUserAppSlugs: vi.fn().mockResolvedValue(["dms"]),
      rotateAuthSession,
    } as unknown as DatabaseService;

    const resolver = new AuthResolver(database);
    const result = await resolver.refresh(refreshToken);
    expect(result.accessToken).toBeTypeOf("string");
    expect(result.refreshToken).toBeTypeOf("string");
    expect(rotateAuthSession).toHaveBeenCalledOnce();
  });
});
