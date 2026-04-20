import type { UserRole } from "@online-order-system/types";

export function getRoleHomePath(role: UserRole): string {
  return role === "admin" ? "/admin/reviews" : "/customer/upload";
}
