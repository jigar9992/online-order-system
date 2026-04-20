import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { AdminSubmissionsController } from "./admin-submissions.controller.js";
import { CustomerOrdersController } from "./customer-orders.controller.js";
import { SubmissionsController } from "./submissions.controller.js";
import { SubmissionsService } from "./submissions.service.js";

@Module({
  imports: [AuthModule],
  controllers: [
    SubmissionsController,
    AdminSubmissionsController,
    CustomerOrdersController,
  ],
  providers: [SubmissionsService],
  exports: [SubmissionsService],
})
export class SubmissionsModule {}
