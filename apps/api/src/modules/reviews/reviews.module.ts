import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { AdminOrdersController } from "./admin-orders.controller.js";
import { ReviewsController } from "./reviews.controller.js";
import { ReviewsService } from "./reviews.service.js";

@Module({
  imports: [AuthModule],
  controllers: [ReviewsController, AdminOrdersController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
