import { Body, Controller, Get, Post } from "@nestjs/common";
import { AuthService } from "./auth.service.js";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  async login(@Body() body: { email?: string; password?: string }) {
    return this.authService.login(body.email ?? "", body.password ?? "");
  }

  @Get("me")
  async me() {
    return {
      message: "current user bootstrap will be wired to HttpOnly JWT cookies",
    };
  }
}
