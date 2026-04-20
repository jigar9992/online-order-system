import { Injectable } from "@nestjs/common";
import { mkdir, readFile, rm, unlink, writeFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import type {
  FileStoragePort,
  SaveFileInput,
  StoredFile,
} from "../../ports/file-storage.port.js";

type StoredFileMetadata = {
  fileName: string;
  contentType: string;
};

function isNotFoundError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ENOENT"
  );
}

@Injectable()
export class LocalFileStorage implements FileStoragePort {
  private readonly storageRoot = resolve(
    process.env.PRESCRIPTION_FILE_STORAGE_DIR ??
      "apps/api/storage/prescriptions",
  );

  async save(input: SaveFileInput): Promise<void> {
    await this.ensureStorageRoot();

    const safeFileName = basename(input.fileName);
    const metadata: StoredFileMetadata = {
      fileName: safeFileName,
      contentType: input.contentType,
    };

    await writeFile(this.getContentPath(input.fileId), input.body);
    await writeFile(
      this.getMetadataPath(input.fileId),
      JSON.stringify(metadata, null, 2),
      "utf8",
    );
  }

  async read(fileId: string): Promise<StoredFile | null> {
    try {
      const [body, metadataBuffer] = await Promise.all([
        readFile(this.getContentPath(fileId)),
        readFile(this.getMetadataPath(fileId), "utf8"),
      ]);

      const metadata = JSON.parse(metadataBuffer) as StoredFileMetadata;
      return {
        fileId,
        fileName: metadata.fileName,
        contentType: metadata.contentType,
        body,
      };
    } catch (error) {
      if (isNotFoundError(error)) {
        return null;
      }

      throw error;
    }
  }

  async delete(fileId: string): Promise<void> {
    await Promise.all([
      unlink(this.getContentPath(fileId)).catch((error: unknown) => {
        if (!isNotFoundError(error)) {
          throw error;
        }
      }),
      unlink(this.getMetadataPath(fileId)).catch((error: unknown) => {
        if (!isNotFoundError(error)) {
          throw error;
        }
      }),
    ]);
  }

  async reset(): Promise<void> {
    await rm(this.storageRoot, { recursive: true, force: true });
    await this.ensureStorageRoot();
  }

  private async ensureStorageRoot(): Promise<void> {
    await mkdir(this.storageRoot, { recursive: true });
  }

  private getContentPath(fileId: string): string {
    return resolve(this.storageRoot, `${fileId}.bin`);
  }

  private getMetadataPath(fileId: string): string {
    return resolve(this.storageRoot, `${fileId}.json`);
  }
}
