import type { JwtPayload } from "@moa/shared/auth";

export type PortalRole = "admin" | "supervisor" | "user";

export const roleLabels: Record<PortalRole, string> = {
  admin: "Admin",
  supervisor: "Supervisor",
  user: "User",
};

export function normalizeRole(role?: string): PortalRole {
  if (role === "admin" || role === "supervisor") {
    return role;
  }
  return "user";
}

export function getPrimaryRole(session: JwtPayload | null | undefined): PortalRole {
  return normalizeRole(session?.roles?.[0]);
}

export function hasAnyRole(session: JwtPayload | null | undefined, roles: PortalRole[]) {
  const assigned = new Set((session?.roles ?? []).map(normalizeRole));
  return roles.some((role) => assigned.has(role));
}

export function getAllowedNav(session: JwtPayload | null | undefined) {
  const primaryRole = getPrimaryRole(session);
  return {
    dashboard: true,
    account: true,
    users: primaryRole === "admin" || primaryRole === "supervisor",
    starter: primaryRole === "admin" || primaryRole === "supervisor",
    admin: primaryRole === "admin",
    dms: (session?.apps ?? []).includes("dms"),
  };
}
