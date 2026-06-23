export type MessageCursor = { createdAt: string; id: string };

export function encodeMessageCursor(createdAt: Date, id: string): string {
  return Buffer.from(JSON.stringify({ createdAt: createdAt.toISOString(), id }), "utf8").toString("base64url");
}

export function decodeMessageCursor(raw?: string | null): MessageCursor | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as MessageCursor;
    if (!parsed?.createdAt || !parsed?.id) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function serializeMessage(m: Record<string, unknown>) {
  return {
    ...m,
    createdAt: m.createdAt instanceof Date ? m.createdAt.toISOString() : m.createdAt,
    deletedAt: m.deletedAt instanceof Date ? m.deletedAt.toISOString() : m.deletedAt ?? null,
    editedAt: m.editedAt instanceof Date ? m.editedAt.toISOString() : m.editedAt ?? null,
  };
}
