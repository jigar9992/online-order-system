import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { SubmissionsService } from "./submissions.service.js";
import { AuthGuard } from "../auth/auth.guard.js";
import { Roles } from "../auth/roles.decorator.js";
import { RoleGuard } from "../auth/role.guard.js";

@Controller("admin/submissions")
@UseGuards(AuthGuard, RoleGuard)
@Roles("admin")
export class AdminSubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Get(":submissionId")
  async getSubmission(@Param("submissionId") submissionId: string) {
    return this.submissionsService.getById(submissionId);
  }
}
