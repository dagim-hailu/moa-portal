import { Args, Field, ID, Int, Mutation, ObjectType, Query, Resolver } from "@nestjs/graphql";
import { Module } from "@nestjs/common";

@ObjectType()
export class DmsFolder {
  @Field(() => ID)
  id!: string;

  @Field({ nullable: true })
  parentId?: string;

  @Field()
  name!: string;

  @Field()
  createdAt!: string;
}

@ObjectType()
export class DmsVersion {
  @Field(() => ID)
  id!: string;

  @Field()
  fileId!: string;

  @Field(() => Int)
  versionNumber!: number;

  @Field()
  objectKey!: string;

  @Field(() => Int)
  size!: number;

  @Field()
  createdAt!: string;
}

@ObjectType()
export class DmsFile {
  @Field(() => ID)
  id!: string;

  @Field()
  folderId!: string;

  @Field()
  name!: string;

  @Field(() => Int)
  version!: number;

  @Field({ nullable: true })
  lockedBy?: string;
}

@ObjectType()
export class UploadRequest {
  @Field()
  uploadUrl!: string;

  @Field()
  objectKey!: string;

  @Field()
  expiresInSeconds!: number;
}

const initialFolders: DmsFolder[] = [
  { id: "root", name: "Policy Library", createdAt: new Date().toISOString() },
  { id: "f-2026", parentId: "root", name: "2026", createdAt: new Date().toISOString() },
];

const initialFiles: DmsFile[] = [
  { id: "file-1", folderId: "f-2026", name: "Policy_2026.md", version: 1 },
  { id: "file-2", folderId: "f-2026", name: "Farm_Report_Q1.docx", version: 3 },
];

const initialVersions: DmsVersion[] = [
  { id: "ver-1", fileId: "file-1", versionNumber: 1, objectKey: "file-1/1", size: 2048, createdAt: new Date().toISOString() },
  { id: "ver-2", fileId: "file-2", versionNumber: 1, objectKey: "file-2/1", size: 2048, createdAt: new Date().toISOString() },
  { id: "ver-3", fileId: "file-2", versionNumber: 2, objectKey: "file-2/2", size: 4096, createdAt: new Date().toISOString() },
  { id: "ver-4", fileId: "file-2", versionNumber: 3, objectKey: "file-2/3", size: 5096, createdAt: new Date().toISOString() },
];

const folders: DmsFolder[] = [];
const files: DmsFile[] = [];
const versions: DmsVersion[] = [];

export function resetDmsState() {
  folders.length = 0;
  files.length = 0;
  versions.length = 0;
  folders.push(...initialFolders.map((entry) => ({ ...entry })));
  files.push(...initialFiles.map((entry) => ({ ...entry })));
  versions.push(...initialVersions.map((entry) => ({ ...entry })));
}

resetDmsState();

@Resolver()
export class DmsResolver {
  @Query(() => [DmsFolder])
  dmsFolders(@Args("parentId", { nullable: true }) parentId?: string) {
    return folders.filter((folder) => folder.parentId === parentId);
  }

  @Query(() => [DmsFile])
  dmsFiles(@Args("folderId", { nullable: true }) folderId?: string) {
    if (!folderId) {
      return files;
    }

    return files.filter((file) => file.folderId === folderId);
  }

  @Query(() => [DmsFile])
  dmsSearch(@Args("query") query: string) {
    const q = query.trim().toLowerCase();
    return files.filter((file) => file.name.toLowerCase().includes(q));
  }

  @Query(() => [DmsVersion])
  dmsVersionHistory(@Args("fileId") fileId: string) {
    return versions
      .filter((version) => version.fileId === fileId)
      .sort((a, b) => b.versionNumber - a.versionNumber);
  }

  @Mutation(() => DmsFolder)
  createFolder(@Args("name") name: string, @Args("parentId", { nullable: true }) parentId?: string) {
    const folder: DmsFolder = {
      id: crypto.randomUUID(),
      parentId,
      name,
      createdAt: new Date().toISOString(),
    };

    folders.push(folder);
    return folder;
  }

  @Mutation(() => DmsFile)
  createInlineDocument(@Args("name") name: string, @Args("folderId") folderId: string) {
    const file: DmsFile = { id: crypto.randomUUID(), folderId, name, version: 1 };
    files.unshift(file);
    versions.push({
      id: crypto.randomUUID(),
      fileId: file.id,
      versionNumber: 1,
      objectKey: `${file.id}/1`,
      size: 0,
      createdAt: new Date().toISOString(),
    });
    return file;
  }

  @Mutation(() => UploadRequest)
  requestUpload(@Args("fileName") fileName: string) {
    const objectKey = `${crypto.randomUUID()}/${fileName}`;
    return {
      uploadUrl: `https://minio.example.local/${objectKey}?signature=mock`,
      objectKey,
      expiresInSeconds: 300,
    };
  }

  @Mutation(() => DmsFile)
  confirmUpload(
    @Args("folderId") folderId: string,
    @Args("fileName") fileName: string,
    @Args("objectKey") objectKey: string,
    @Args("size", { type: () => Int }) size: number,
  ) {
    const existing = files.find((entry) => entry.name === fileName && entry.folderId === folderId);
    if (existing) {
      existing.version += 1;
      versions.push({
        id: crypto.randomUUID(),
        fileId: existing.id,
        versionNumber: existing.version,
        objectKey,
        size,
        createdAt: new Date().toISOString(),
      });
      return existing;
    }

    const file: DmsFile = {
      id: crypto.randomUUID(),
      folderId,
      name: fileName,
      version: 1,
    };

    files.unshift(file);
    versions.push({
      id: crypto.randomUUID(),
      fileId: file.id,
      versionNumber: 1,
      objectKey,
      size,
      createdAt: new Date().toISOString(),
    });
    return file;
  }

  @Mutation(() => DmsFile)
  checkoutFile(@Args("id") id: string, @Args("user") user: string) {
    const file = files.find((item) => item.id === id);
    if (!file) {
      throw new Error("File not found");
    }

    if (file.lockedBy && file.lockedBy !== user) {
      throw new Error("Already locked");
    }

    file.lockedBy = user;
    return file;
  }

  @Mutation(() => DmsFile)
  checkinFile(@Args("id") id: string, @Args("user") user: string) {
    const file = files.find((item) => item.id === id);
    if (!file) {
      throw new Error("File not found");
    }

    if (file.lockedBy !== user) {
      throw new Error("Only locker can check in");
    }

    file.lockedBy = undefined;
    file.version += 1;
    versions.push({
      id: crypto.randomUUID(),
      fileId: file.id,
      versionNumber: file.version,
      objectKey: `${file.id}/${file.version}`,
      size: 0,
      createdAt: new Date().toISOString(),
    });
    return file;
  }
}

@Module({ providers: [DmsResolver] })
export class DmsModule {}
