import { Args, Context, Field, Mutation, ObjectType, Query, Resolver } from "@nestjs/graphql";
import { Module, UnauthorizedException } from "@nestjs/common";
import { verifyPortalJwt } from "@moa/shared/auth";
import { DatabaseService } from "../db/database.service";
import { DatabaseModule } from "../db/database.module";

@ObjectType()
export class MyApp {
  @Field()
  id!: string;

  @Field()
  slug!: string;

  @Field()
  nameEn!: string;

  @Field()
  nameAm!: string;

  @Field()
  descriptionEn!: string;

  @Field()
  descriptionAm!: string;

  @Field()
  routePath!: string;

  @Field()
  searchEnabled!: boolean;
}

@ObjectType()
export class PortalProfile {
  @Field()
  id!: string;

  @Field()
  email!: string;

  @Field()
  fullName!: string;

  @Field()
  locale!: string;
}

@ObjectType()
export class PortalAnnouncement {
  @Field()
  id!: string;

  @Field()
  titleEn!: string;

  @Field()
  titleAm!: string;

  @Field()
  bodyEn!: string;

  @Field()
  bodyAm!: string;
}

@ObjectType()
export class ContactSubmission {
  @Field()
  id!: string;

  @Field()
  success!: boolean;
}

type GqlContext = { req: { headers: Record<string, string | string[] | undefined> } };

async function requireUser(context: GqlContext) {
  const header = context.req.headers.authorization ?? context.req.headers.Authorization;
  const raw = Array.isArray(header) ? header[0] : header;
  const token = raw?.startsWith("Bearer ") ? raw.slice(7) : null;

  if (!token) {
    throw new UnauthorizedException("Authentication required");
  }

  try {
    return await verifyPortalJwt(token, process.env.JWT_SECRET ?? "replace_me");
  } catch {
    throw new UnauthorizedException("Invalid token");
  }
}

@Resolver()
export class PortalResolver {
  constructor(private readonly database: DatabaseService) {}

  @Query(() => [MyApp])
  async myApps(@Context() context: GqlContext) {
    const user = await requireUser(context);
    const apps = await this.database.listMyApps(user.sub);
    return apps.map((app) => ({
      id: app.id,
      slug: app.slug,
      nameEn: app.nameEn,
      nameAm: app.nameAm,
      descriptionEn: app.descriptionEn,
      descriptionAm: app.descriptionAm,
      routePath: app.routePath,
      searchEnabled: app.searchEnabled,
    }));
  }

  @Query(() => PortalProfile)
  async me(@Context() context: GqlContext) {
    const user = await requireUser(context);
    const record = await this.database.findUserById(user.sub);
    if (!record) {
      throw new UnauthorizedException("User not found");
    }

    return {
      id: record.id,
      email: record.email,
      fullName: record.fullName,
      locale: record.locale,
    };
  }

  @Query(() => [PortalAnnouncement])
  async portalAnnouncements() {
    const rows = await this.database.listAnnouncements();
    return rows.map((row) => ({
      id: row.id,
      titleEn: row.titleEn,
      titleAm: row.titleAm,
      bodyEn: row.bodyEn,
      bodyAm: row.bodyAm,
    }));
  }

  @Mutation(() => ContactSubmission)
  async submitContact(
    @Args("fullName") fullName: string,
    @Args("email") email: string,
    @Args("message") message: string,
  ) {
    const created = await this.database.submitContactMessage({
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      message: message.trim(),
    });

    return { id: created.id, success: true };
  }
}

@Module({
  imports: [DatabaseModule],
  providers: [PortalResolver],
})
export class PortalModule {}
