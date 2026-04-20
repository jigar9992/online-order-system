import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import type { CreateSubmissionRequest } from "@online-order-system/types";
import { SubmissionsService } from "./submissions.service.js";
import { AuthGuard } from "../auth/auth.guard.js";
import { CurrentUser } from "../auth/current-user.decorator.js";
import { Roles } from "../auth/roles.decorator.js";
import { RoleGuard } from "../auth/role.guard.js";

@Controller("customer/submissions")
@UseGuards(AuthGuard, RoleGuard)
@Roles("customer")
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Post()
  async create(
    @CurrentUser() user: { userId: string },
    @Body() body: CreateSubmissionRequest,
  ) {
    return this.submissionsService.create(user.userId, body);
  }
}
