import { Controller, Param, Post, UseGuards } from "@nestjs/common";
import { ReviewsService } from "./reviews.service.js";
import { AuthGuard } from "../auth/auth.guard.js";
import { CurrentUser } from "../auth/current-user.decorator.js";
import { Roles } from "../auth/roles.decorator.js";
import { RoleGuard } from "../auth/role.guard.js";

@Controller("admin/orders")
@UseGuards(AuthGuard, RoleGuard)
@Roles("admin")
export class AdminOrdersController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post(":orderId/deliver")
  async deliver(
    @CurrentUser() user: { userId: string; email: string; role: "admin" },
    @Param("orderId") orderId: string,
  ) {
    return this.reviewsService.deliver(orderId, user);
  }
}
