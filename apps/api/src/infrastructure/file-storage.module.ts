import { Global, Module } from "@nestjs/common";
import { FILE_STORAGE } from "../common/tokens.js";
import { LocalFileStorage } from "../adapters/local/local-file-storage.js";

@Global()
@Module({
  providers: [
    {
      provide: FILE_STORAGE,
      useClass: LocalFileStorage,
    },
  ],
  exports: [FILE_STORAGE],
})
export class FileStorageModule {}
