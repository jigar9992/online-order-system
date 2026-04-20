import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Res,
  UseGuards,
} from "@nestjs/common";
import type { LoginRequest } from "@online-order-system/types";
import { AuthService } from "./auth.service.js";
import { AuthGuard } from "./auth.guard.js";
import { CurrentUser } from "./current-user.decorator.js";
import type { HeaderWritableResponse } from "./auth.types.js";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  @HttpCode(200)
  async login(
    @Body() body: Partial<LoginRequest>,
    @Res({ passthrough: true }) response: HeaderWritableResponse,
  ) {
    const session = await this.authService.login(
      body.email ?? "",
      body.password ?? "",
    );
    response.setHeader(
      "Set-Cookie",
      this.authService.createSessionCookie(session),
    );
    return session;
  }

  @Post("logout")
  @HttpCode(204)
  async logout(
    @Res({ passthrough: true }) response: HeaderWritableResponse,
  ): Promise<void> {
    response.setHeader("Set-Cookie", this.authService.clearSessionCookie());
  }

  @Get("me")
  @UseGuards(AuthGuard)
  async me(
    @CurrentUser()
    user: {
      userId: string;
      email: string;
      role: "customer" | "admin";
    },
  ) {
    return user;
  }
}
