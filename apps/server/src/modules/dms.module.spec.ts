import { beforeEach, describe, expect, it } from "vitest";
import { DmsResolver, resetDmsState } from "./dms.module";

describe("DmsResolver", () => {
  let resolver: DmsResolver;

  beforeEach(() => {
    resetDmsState();
    resolver = new DmsResolver();
  });

  it("creates folder and inline document", () => {
    const folder = resolver.createFolder("Reports", "root");
    const doc = resolver.createInlineDocument("Untitled Document", folder.id);

    expect(folder.parentId).toBe("root");
    expect(doc.folderId).toBe(folder.id);
    expect(doc.version).toBe(1);
  });

  it("checks out and checks in file", () => {
    const checkedOut = resolver.checkoutFile("file-1", "editor-1");
    expect(checkedOut.lockedBy).toBe("editor-1");

    const checkedIn = resolver.checkinFile("file-1", "editor-1");
    expect(checkedIn.lockedBy).toBeUndefined();
    expect(checkedIn.version).toBe(2);
  });
});
