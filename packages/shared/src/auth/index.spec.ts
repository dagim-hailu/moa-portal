import { describe, expect, it } from "vitest";
import { signPortalJwt, signRefreshToken, verifyPortalJwt, verifyRefreshToken } from "./index";

describe("shared auth", () => {
  it("signs and verifies a jwt", async () => {
    const token = await signPortalJwt(
      {
        sub: "u-1",
        email: "u@moa.gov.et",
        username: "u1",
        roles: ["user"],
        apps: ["dms"],
      },
      "test-secret",
    );

    const payload = await verifyPortalJwt(token, "test-secret");
    expect(payload.sub).toBe("u-1");
    expect(payload.apps).toEqual(["dms"]);
  });

  it("signs and verifies a refresh token", async () => {
    const token = await signRefreshToken(
      {
        sub: "u-1",
        email: "u@moa.gov.et",
        username: "u1",
        roles: ["user"],
        sessionId: "session-1",
      },
      "test-secret",
    );

    const payload = await verifyRefreshToken(token, "test-secret");
    expect(payload.type).toBe("refresh");
    expect(payload.sessionId).toBe("session-1");
  });
});
