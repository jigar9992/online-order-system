import {
  Controller,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { SubmissionsService } from "./submissions.service.js";
import { AuthGuard } from "../auth/auth.guard.js";
import { CurrentUser } from "../auth/current-user.decorator.js";
import { Roles } from "../auth/roles.decorator.js";
import { RoleGuard } from "../auth/role.guard.js";
import type { UploadedPrescriptionFile } from "./submission-upload.js";

@Controller("customer/orders")
@UseGuards(AuthGuard, RoleGuard)
@Roles("customer")
export class CustomerOrdersController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Post(":orderId/resubmit")
  @UseInterceptors(FileInterceptor("file"))
  async resubmit(
    @CurrentUser() user: { userId: string },
    @Param("orderId") orderId: string,
    @UploadedFile() file: UploadedPrescriptionFile | undefined,
  ) {
    return this.submissionsService.resubmit(user.userId, orderId, file);
  }
}
