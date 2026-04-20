import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { FilesService } from "./files.service.js";
import { AuthGuard } from "../auth/auth.guard.js";

@Controller("files")
@UseGuards(AuthGuard)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Get()
  async list() {
    return this.filesService.listFiles();
  }

  @Get(":fileId")
  async getFile(@Param("fileId") fileId: string) {
    return this.filesService.getFile(fileId);
  }
}
