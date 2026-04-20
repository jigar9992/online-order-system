import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";
import { AuthTokenService } from "./auth-token.service.js";
import { AuthGuard } from "./auth.guard.js";
import { RoleGuard } from "./role.guard.js";

@Module({
  controllers: [AuthController],
  providers: [AuthService, AuthTokenService, AuthGuard, RoleGuard],
  exports: [AuthService, AuthTokenService, AuthGuard, RoleGuard],
})
export class AuthModule {}
