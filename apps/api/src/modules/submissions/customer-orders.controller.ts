import { Body, Controller, Param, Post, UseGuards } from "@nestjs/common";
import type { CreateSubmissionRequest } from "@online-order-system/types";
import { SubmissionsService } from "./submissions.service.js";
import { AuthGuard } from "../auth/auth.guard.js";
import { CurrentUser } from "../auth/current-user.decorator.js";
import { Roles } from "../auth/roles.decorator.js";
import { RoleGuard } from "../auth/role.guard.js";

@Controller("customer/orders")
@UseGuards(AuthGuard, RoleGuard)
@Roles("customer")
export class CustomerOrdersController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Post(":orderId/resubmit")
  async resubmit(
    @CurrentUser() user: { userId: string },
    @Param("orderId") orderId: string,
    @Body() body: CreateSubmissionRequest,
  ) {
    return this.submissionsService.resubmit(user.userId, orderId, body);
  }
}
