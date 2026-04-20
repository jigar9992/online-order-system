import {
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { SubmissionsService } from "./submissions.service.js";
import { AuthGuard } from "../auth/auth.guard.js";
import { CurrentUser } from "../auth/current-user.decorator.js";
import { Roles } from "../auth/roles.decorator.js";
import { RoleGuard } from "../auth/role.guard.js";
import type { UploadedPrescriptionFile } from "./submission-upload.js";

@Controller("customer/submissions")
@UseGuards(AuthGuard, RoleGuard)
@Roles("customer")
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Post()
  @UseInterceptors(FileInterceptor("file"))
  async create(
    @CurrentUser() user: { userId: string },
    @UploadedFile() file: UploadedPrescriptionFile | undefined,
  ) {
    return this.submissionsService.create(user.userId, file);
  }
}
