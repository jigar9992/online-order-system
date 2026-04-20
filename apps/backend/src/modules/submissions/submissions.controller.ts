import { Body, Controller, Param, Post } from "@nestjs/common";
import type { CreateSubmissionRequest } from "@online-order-system/contracts";
import { SubmissionsService } from "./submissions.service.js";

@Controller("customer/submissions")
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Post()
  async create(@Body() body: CreateSubmissionRequest) {
    return this.submissionsService.create("user_customer", body);
  }
}
