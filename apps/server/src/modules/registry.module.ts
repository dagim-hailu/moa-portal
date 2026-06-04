import { Args, Field, ID, Mutation, ObjectType, Query, Resolver } from "@nestjs/graphql";
import { Module } from "@nestjs/common";
import bcrypt from "bcryptjs";
import { DatabaseService } from "../db/database.service";
import { DatabaseModule } from "../db/database.module";

@ObjectType()
export class Application {
  @Field(() => ID)
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
  isActive!: boolean;

  @Field()
  searchEnabled!: boolean;

  @Field()
  assignedUsers!: number;
}

@ObjectType()
export class PortalUser {
  @Field(() => ID)
  id!: string;

  @Field()
  email!: string;

  @Field()
  username!: string;

  @Field()
  fullName!: string;

  @Field()
  role!: string;

  @Field()
  isActive!: boolean;

  @Field()
  createdAt!: string;
}

@ObjectType()
export class UserAssignment {
  @Field(() => ID)
  id!: string;

  @Field()
  applicationSlug!: string;

  @Field()
  userId!: string;

  @Field()
  assignedAt!: string;
}

@ObjectType()
export class AuditLog {
  @Field(() => ID)
  id!: string;

  @Field({ nullable: true })
  actorUserId?: string;

  @Field()
  action!: string;

  @Field()
  targetType!: string;

  @Field()
  targetId!: string;

  @Field()
  details!: string;

  @Field()
  createdAt!: string;
}

@Resolver(() => Application)
export class RegistryResolver {
  constructor(private readonly database: DatabaseService) {}

  @Query(() => [Application])
  async applications() {
    return this.database.listApplications();
  }

  @Query(() => [PortalUser])
  async portalUsers() {
    return this.database.listUsers();
  }

  @Query(() => [UserAssignment])
  async userAssignments(@Args("slug") slug: string) {
    const rows = await this.database.listAssignmentsForSlug(slug);
    return rows.map((row) => ({
      ...row,
      assignedAt: row.assignedAt instanceof Date ? row.assignedAt.toISOString() : row.assignedAt,
    }));
  }

  @Mutation(() => Application)
  async registerApplication(
    @Args("slug") slug: string,
    @Args("nameEn") nameEn: string,
    @Args("nameAm") nameAm: string,
    @Args("descriptionEn") descriptionEn: string,
    @Args("descriptionAm") descriptionAm: string,
    @Args("routePath") routePath: string,
    @Args("searchEnabled") searchEnabled: boolean,
  ) {
    return this.database.registerApplication({
      slug,
      nameEn,
      nameAm,
      descriptionEn,
      descriptionAm,
      routePath,
      searchEnabled,
    });
  }

  @Mutation(() => Application)
  async updateApplication(
    @Args("id") id: string,
    @Args("slug") slug: string,
    @Args("nameEn") nameEn: string,
    @Args("nameAm") nameAm: string,
    @Args("descriptionEn") descriptionEn: string,
    @Args("descriptionAm") descriptionAm: string,
    @Args("routePath") routePath: string,
    @Args("searchEnabled") searchEnabled: boolean,
  ) {
    return this.database.updateApplication({
      id,
      slug,
      nameEn,
      nameAm,
      descriptionEn,
      descriptionAm,
      routePath,
      searchEnabled,
    });
  }

  @Mutation(() => Boolean)
  async toggleApplication(@Args("slug") slug: string, @Args("isActive") isActive: boolean) {
    return this.database.toggleApplication(slug, isActive);
  }

  @Mutation(() => PortalUser)
  async createUser(
    @Args("email") email: string,
    @Args("username") username: string,
    @Args("fullName") fullName: string,
    @Args("role") role: string,
    @Args("password") password: string,
  ) {
    const passwordHash = await bcrypt.hash(password, 10);
    return this.database.createUser({
      email,
      username,
      fullName,
      role: role as any,
      passwordHash,
    });
  }

  @Mutation(() => PortalUser)
  async updateUser(
    @Args("id") id: string,
    @Args("email", { nullable: true }) email?: string,
    @Args("username", { nullable: true }) username?: string,
    @Args("fullName", { nullable: true }) fullName?: string,
    @Args("role", { nullable: true }) role?: string,
    @Args("isActive", { nullable: true }) isActive?: boolean,
  ) {
    return this.database.updateUser({
      id,
      email,
      username,
      fullName,
      role: role as any,
      isActive,
    });
  }

  @Mutation(() => UserAssignment)
  async assignUser(@Args("slug") slug: string, @Args("userId") userId: string) {
    return this.database.assignUser(slug, userId);
  }

  @Mutation(() => Boolean)
  async revokeUser(@Args("slug") slug: string, @Args("userId") userId: string) {
    return this.database.revokeUser(slug, userId);
  }
}

@Module({
  imports: [DatabaseModule],
  providers: [RegistryResolver],
})
export class RegistryModule {}

// Test helper: kept for compatibility with existing specs
export function resetRegistryState() {
  // No-op when using PostgreSQL; tests should use integration DB or mocks.
}
