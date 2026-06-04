import { describe, expect, it } from "vitest";
import { t } from "./index";

describe("i18n", () => {
  it("returns translated values", () => {
    expect(t("en", "auth.signIn")).toBe("Sign In");
    expect(t("am", "auth.signIn")).not.toBe("Sign In");
  });
});
