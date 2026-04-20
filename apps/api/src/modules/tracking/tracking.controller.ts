import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { TrackingService } from "./tracking.service.js";
import { AuthGuard } from "../auth/auth.guard.js";
import { Roles } from "../auth/roles.decorator.js";
import { RoleGuard } from "../auth/role.guard.js";

@Controller("customer/orders")
@UseGuards(AuthGuard, RoleGuard)
@Roles("customer")
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Get(":orderId")
  async getOrder(@Param("orderId") orderId: string) {
    return this.trackingService.getOrder(orderId);
  }
}
