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
import { CurrentUser } from "../auth/current-user.decorator.js";
import type { HeaderWritableResponse } from "../auth/auth.types.js";
import { Roles } from "../auth/roles.decorator.js";
import { RoleGuard } from "../auth/role.guard.js";

function createInlineDisposition(fileName: string): string {
  const sanitizedFileName = fileName.replace(/["\\]/g, "_");
  const encodedFileName = encodeURIComponent(fileName);
  return `inline; filename="${sanitizedFileName}"; filename*=UTF-8''${encodedFileName}`;
}

@Controller("files")
@UseGuards(AuthGuard, RoleGuard)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Get()
  @Roles("admin")
  async list() {
    return this.filesService.listFiles();
  }

  @Get(":fileId")
  async getFile(
    @CurrentUser()
    user: { userId: string; email: string; role: "customer" | "admin" },
    @Param("fileId") fileId: string,
    @Res({ passthrough: true }) response: HeaderWritableResponse,
  ) {
    const file = await this.filesService.getFile(fileId, user);
    response.setHeader("Content-Type", file.contentType);
    response.setHeader("Content-Length", file.body.byteLength.toString());
    response.setHeader(
      "Content-Disposition",
      createInlineDisposition(file.fileName),
    );
    return new StreamableFile(file.body);
  }
}
