import { Controller, Get, Param } from "@nestjs/common";
import { TrackingService } from "./tracking.service.js";

@Controller("customer/orders")
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Get(":orderId")
  async getOrder(@Param("orderId") orderId: string) {
    return this.trackingService.getOrder(orderId);
  }
}
