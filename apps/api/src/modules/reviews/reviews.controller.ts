import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import type { ReviewDecisionRequest } from "@online-order-system/types";
import { ReviewsService } from "./reviews.service.js";
import { AuthGuard } from "../auth/auth.guard.js";
import { CurrentUser } from "../auth/current-user.decorator.js";
import { Roles } from "../auth/roles.decorator.js";
import { RoleGuard } from "../auth/role.guard.js";

@Controller("admin/reviews")
@UseGuards(AuthGuard, RoleGuard)
@Roles("admin")
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  async list(@Query("status") status?: string) {
    if (status && status !== "pending") {
      return [];
    }

    return this.reviewsService.listPending();
  }

  @Post(":submissionId/approve")
  async approve(
    @CurrentUser() user: { userId: string; email: string; role: "admin" },
    @Param("submissionId") submissionId: string,
  ) {
    return this.reviewsService.approve(submissionId, user);
  }

  @Post(":submissionId/reject")
  async reject(
    @CurrentUser() user: { userId: string; email: string; role: "admin" },
    @Param("submissionId") submissionId: string,
    @Body() body: ReviewDecisionRequest,
  ) {
    return this.reviewsService.reject(submissionId, user, body);
  }
}
