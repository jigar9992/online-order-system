export type SaveFileInput = {
  fileId: string;
  fileName: string;
  contentType: string;
  body: Buffer;
};

export type StoredFile = {
  fileId: string;
  fileName: string;
  contentType: string;
  body: Buffer;
};

export interface FileStoragePort {
  save(input: SaveFileInput): Promise<void>;
  read(fileId: string): Promise<StoredFile | null>;
  delete(fileId: string): Promise<void>;
  reset(): Promise<void>;
}
