import { SignJWT, jwtVerify } from "jose";

const encoder = new TextEncoder();

export type PortalRole = "admin" | "supervisor" | "user";

export type JwtPayload = {
  sub: string;
  email: string;
  username: string;
  fullName?: string;
  roles: PortalRole[];
  apps: string[];
  sessionId?: string;
  type?: "access";
};

export type RefreshTokenPayload = {
  sub: string;
  email: string;
  username: string;
  roles: PortalRole[];
  sessionId: string;
  type: "refresh";
};

async function signToken(payload: Record<string, unknown>, secret: string, expiresIn: string) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(encoder.encode(secret));
}

export async function signAccessToken(payload: JwtPayload, secret: string, expiresIn = "15m") {
  return signToken({ ...payload, type: "access" }, secret, expiresIn);
}

export async function signRefreshToken(payload: Omit<RefreshTokenPayload, "type">, secret: string, expiresIn = "7d") {
  return signToken({ ...payload, type: "refresh" }, secret, expiresIn);
}

export async function signPortalJwt(payload: JwtPayload, secret: string, expiresIn = "15m") {
  return signAccessToken(payload, secret, expiresIn);
}

export async function verifyAccessToken(token: string, secret: string) {
  const { payload } = await jwtVerify(token, encoder.encode(secret));
  const typed = payload as unknown as JwtPayload;

  if (typed.type && typed.type !== "access") {
    throw new Error("Invalid access token");
  }

  return typed;
}

export async function verifyRefreshToken(token: string, secret: string) {
  const { payload } = await jwtVerify(token, encoder.encode(secret));
  const typed = payload as unknown as RefreshTokenPayload;

  if (typed.type !== "refresh") {
    throw new Error("Invalid refresh token");
  }

  return typed;
}

export async function verifyPortalJwt(token: string, secret: string) {
  return verifyAccessToken(token, secret);
}
