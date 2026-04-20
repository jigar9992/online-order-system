import { Controller, Get, Param } from "@nestjs/common";
import { FilesService } from "./files.service.js";

@Controller("files")
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
