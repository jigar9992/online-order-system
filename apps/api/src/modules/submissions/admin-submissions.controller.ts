import { Controller, Get, Param } from "@nestjs/common";
import { SubmissionsService } from "./submissions.service.js";

@Controller("admin/submissions")
export class AdminSubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Get(":submissionId")
  async getSubmission(@Param("submissionId") submissionId: string) {
    return this.submissionsService.getById(submissionId);
  }
}
