export const userRoles = ["customer", "admin"] as const;
export type UserRole = (typeof userRoles)[number];

export const submissionStatuses = ["pending", "approved", "rejected"] as const;
export type SubmissionStatus = (typeof submissionStatuses)[number];

export const orderStatuses = ["pending", "approved", "delivered"] as const;
export type OrderStatus = (typeof orderStatuses)[number];

export type FileKind = "image" | "pdf";
export const maxPrescriptionUploadSizeBytes = 5 * 1024 * 1024;
export const prescriptionUploadMaxBytes = maxPrescriptionUploadSizeBytes;
export const supportedPrescriptionMimeTypes = [
  "image/png",
  "image/jpeg",
  "application/pdf",
] as const;
export type SupportedPrescriptionMimeType =
  (typeof supportedPrescriptionMimeTypes)[number];

export type AuthSession = {
  userId: string;
  email: string;
  role: UserRole;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type PrescriptionSubmission = {
  id: string;
  orderId: string;
  customerId: string;
  fileId: string;
  fileName: string;
  fileKind: FileKind;
  status: SubmissionStatus;
  rejectionReason: string | null;
  createdAt: string;
  reviewedAt: string | null;
};

export type OrderSummary = {
  id: string;
  customerId: string;
  status: OrderStatus;
  latestSubmissionId: string | null;
  latestDecision: SubmissionStatus | null;
  history: Array<{
    submissionId: string;
    status: SubmissionStatus;
    actorId: string;
    reason: string | null;
    createdAt: string;
  }>;
};

export type CreateSubmissionRequest = {
  fileName: string;
  fileKind: FileKind;
  fileSize: number;
};

export type ReviewDecisionRequest = {
  reason?: string;
};

export function isSubmissionStatus(value: string): value is SubmissionStatus {
  return (submissionStatuses as readonly string[]).includes(value);
}

export function isOrderStatus(value: string): value is OrderStatus {
  return (orderStatuses as readonly string[]).includes(value);
}

export function isUserRole(value: string): value is UserRole {
  return (userRoles as readonly string[]).includes(value);
}

export function isSupportedPrescriptionMimeType(
  value: string,
): value is SupportedPrescriptionMimeType {
  return (supportedPrescriptionMimeTypes as readonly string[]).includes(value);
}

export function normalizeRejectionReason(
  value: string | undefined,
): string | null {
  const reason = value?.trim();
  return reason ? reason : null;
}
