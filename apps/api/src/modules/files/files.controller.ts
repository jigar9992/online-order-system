import {
  Controller,
  Get,
  Param,
  Res,
  StreamableFile,
  UseGuards,
} from "@nestjs/common";
import { FilesService } from "./files.service.js";
import { AuthGuard } from "../auth/auth.guard.js";
import type { HeaderWritableResponse } from "../auth/auth.types.js";

function createInlineDisposition(fileName: string): string {
  const sanitizedFileName = fileName.replace(/["\\]/g, "_");
  const encodedFileName = encodeURIComponent(fileName);
  return `inline; filename="${sanitizedFileName}"; filename*=UTF-8''${encodedFileName}`;
}

@Controller("files")
@UseGuards(AuthGuard)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Get()
  async list() {
    return this.filesService.listFiles();
  }

  @Get(":fileId")
  async getFile(
    @Param("fileId") fileId: string,
    @Res({ passthrough: true }) response: HeaderWritableResponse,
  ) {
    const file = await this.filesService.getFile(fileId);
    response.setHeader("Content-Type", file.contentType);
    response.setHeader("Content-Length", file.body.byteLength.toString());
    response.setHeader(
      "Content-Disposition",
      createInlineDisposition(file.fileName),
    );
    return new StreamableFile(file.body);
  }
}
