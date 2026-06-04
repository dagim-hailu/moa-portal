import { randomUUID, createHash } from "crypto";
import { Args, Field, Mutation, ObjectType, Resolver } from "@nestjs/graphql";
import { Module, UnauthorizedException } from "@nestjs/common";
import bcrypt from "bcryptjs";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  type PortalRole,
} from "@moa/shared/auth";
import { DatabaseService } from "../db/database.service";
import { DatabaseModule } from "../db/database.module";

@ObjectType()
class AuthUser {
  @Field()
  id!: string;

  @Field()
  email!: string;

  @Field()
  username!: string;

  @Field()
  fullName!: string;

  @Field()
  role!: string;
}

@ObjectType()
class AuthPayload {
  @Field()
  accessToken!: string;

  @Field()
  refreshToken!: string;

  @Field(() => AuthUser)
  user!: AuthUser;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-z0-9](?:[a-z0-9._-]{1,30}[a-z0-9])?$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,64}$/;
const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL = "7d";
const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function normalizeRole(role?: string): PortalRole {
  if (role === "admin" || role === "supervisor") {
    return role;
  }
  return "user";
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

function validateEmail(email: string) {
  return EMAIL_REGEX.test(email);
}

function validateUsername(username: string) {
  return USERNAME_REGEX.test(username);
}

function validatePassword(password: string) {
  return PASSWORD_REGEX.test(password);
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

@Resolver()
export class AuthResolver {
  constructor(private readonly database: DatabaseService) {}

  private async buildAuthPayload(user: {
    id: string;
    email: string;
    username: string;
    fullName: string;
    role: string;
  }) {
    const sessionId = randomUUID();
    const role = normalizeRole(user.role);
    const apps = await this.database.getUserAppSlugs(user.id);

    const accessToken = await signAccessToken(
      {
        sub: user.id,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        roles: [role],
        apps,
        sessionId,
      },
      process.env.JWT_SECRET ?? "replace_me",
      ACCESS_TOKEN_TTL,
    );

    const refreshToken = await signRefreshToken(
      {
        sub: user.id,
        email: user.email,
        username: user.username,
        roles: [role],
        sessionId,
      },
      process.env.JWT_SECRET ?? "replace_me",
      REFRESH_TOKEN_TTL,
    );

    await this.database.createAuthSession({
      id: sessionId,
      userId: user.id,
      refreshTokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_MAX_AGE_MS),
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        role,
      },
    };
  }

  private async rotateRefreshSession(
    user: {
      id: string;
      email: string;
      username: string;
      fullName: string;
      role: string;
    },
    sessionId: string,
  ) {
    const role = normalizeRole(user.role);
    const apps = await this.database.getUserAppSlugs(user.id);
    const accessToken = await signAccessToken(
      {
        sub: user.id,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        roles: [role],
        apps,
        sessionId,
      },
      process.env.JWT_SECRET ?? "replace_me",
      ACCESS_TOKEN_TTL,
    );

    const refreshToken = await signRefreshToken(
      {
        sub: user.id,
        email: user.email,
        username: user.username,
        roles: [role],
        sessionId,
      },
      process.env.JWT_SECRET ?? "replace_me",
      REFRESH_TOKEN_TTL,
    );

    await this.database.rotateAuthSession(
      sessionId,
      hashToken(refreshToken),
      new Date(Date.now() + REFRESH_TOKEN_MAX_AGE_MS),
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        role,
      },
    };
  }

  @Mutation(() => AuthPayload)
  async signup(
    @Args("email") email: string,
    @Args("username") username: string,
    @Args("password") password: string,
    @Args("fullName", { nullable: true }) fullName?: string,
    @Args("locale", { nullable: true }) locale?: string,
  ) {
    const normalizedEmail = normalizeEmail(email);
    const normalizedUsername = normalizeUsername(username);

    if (
      !normalizedEmail ||
      !normalizedUsername ||
      !validateEmail(normalizedEmail) ||
      !validateUsername(normalizedUsername) ||
      !validatePassword(password)
    ) {
      throw new UnauthorizedException("Invalid input");
    }

    const [existingEmail, existingUsername] = await Promise.all([
      this.database.findUserByEmail(normalizedEmail),
      this.database.findUserByUsername(normalizedUsername),
    ]);
    if (existingEmail) {
      throw new UnauthorizedException("Email already exists");
    }
    if (existingUsername) {
      throw new UnauthorizedException("Username already exists");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.database.createUser({
      email: normalizedEmail,
      username: normalizedUsername,
      passwordHash,
      fullName: fullName?.trim() || normalizedEmail.split("@")[0],
      role: "user",
      locale: locale?.trim() || "en",
    });

    return this.buildAuthPayload(user);
  }

  @Mutation(() => AuthPayload)
  async login(@Args("identifier") identifier: string, @Args("password") password: string) {
    if (!identifier || !password) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const user = await this.database.findUserByIdentifier(identifier);
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    return this.buildAuthPayload(user);
  }

  @Mutation(() => AuthPayload)
  async refresh(@Args("refreshToken") refreshToken: string) {
    let payload;
    try {
      payload = await verifyRefreshToken(refreshToken, process.env.JWT_SECRET ?? "replace_me");
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }

    const session = await this.database.findActiveAuthSession(payload.sessionId);
    if (!session || session.refreshTokenHash !== hashToken(refreshToken)) {
      throw new UnauthorizedException("Session expired");
    }

    const user = await this.database.findUserById(payload.sub);
    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    return this.rotateRefreshSession(user, payload.sessionId);
  }

  @Mutation(() => Boolean)
  async logout(@Args("refreshToken") refreshToken: string) {
    try {
      const payload = await verifyRefreshToken(refreshToken, process.env.JWT_SECRET ?? "replace_me");
      return this.database.revokeAuthSession(payload.sessionId);
    } catch {
      return true;
    }
  }
}

@Module({
  imports: [DatabaseModule],
  providers: [AuthResolver],
})
export class AuthModule {}
