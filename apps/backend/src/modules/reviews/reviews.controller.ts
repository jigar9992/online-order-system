import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import type { ReviewDecisionRequest } from "@online-order-system/contracts";
import { ReviewsService } from "./reviews.service.js";

@Controller("admin/reviews")
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
  async approve(@Param("submissionId") submissionId: string) {
    return this.reviewsService.approve(submissionId);
  }

  @Post(":submissionId/reject")
  async reject(
    @Param("submissionId") submissionId: string,
    @Body() body: ReviewDecisionRequest,
  ) {
    return this.reviewsService.reject(submissionId, body);
  }
}
