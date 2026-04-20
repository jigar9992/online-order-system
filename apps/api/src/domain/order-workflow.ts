import {
  isOrderStatus,
  isSubmissionStatus,
  type FileKind,
  type OrderStatus,
  type PrescriptionSubmission,
  type SubmissionStatus,
} from "@online-order-system/types";

export type WorkflowActor = {
  actorId: string;
  role: "customer" | "admin";
};

export type SubmissionFile = {
  fileId: string;
  fileName: string;
  fileKind: FileKind;
  fileSize: number;
};

export type SubmissionFileInput = Omit<SubmissionFile, "fileId">;

export type OrderRecord = {
  id: string;
  customerId: string;
  status: OrderStatus;
  latestSubmissionId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ReviewEvent = {
  submissionId: string;
  orderId: string;
  status: SubmissionStatus;
  actorId: string;
  reason: string | null;
  createdAt: string;
};

export type WorkflowSnapshot = {
  order: OrderRecord;
  submission: PrescriptionSubmission;
  event: ReviewEvent;
};

const allowedSubmissionStatusTransitions: Record<
  SubmissionStatus,
  SubmissionStatus[]
> = {
  pending: ["approved", "rejected"],
  approved: [],
  rejected: [],
};

const allowedOrderStatusTransitions: Record<OrderStatus, OrderStatus[]> = {
  pending: ["approved"],
  approved: ["delivered"],
  delivered: [],
};

export function assertSubmissionStatusTransition(
  fromStatus: SubmissionStatus,
  toStatus: SubmissionStatus,
): void {
  if (!isSubmissionStatus(fromStatus) || !isSubmissionStatus(toStatus)) {
    throw new Error("Invalid submission status transition");
  }

  if (!allowedSubmissionStatusTransitions[fromStatus].includes(toStatus)) {
    throw new Error(
      `Transition from ${fromStatus} to ${toStatus} is not allowed`,
    );
  }
}

export function assertOrderStatusTransition(
  fromStatus: OrderStatus,
  toStatus: OrderStatus,
): void {
  if (!isOrderStatus(fromStatus) || !isOrderStatus(toStatus)) {
    throw new Error("Invalid order status transition");
  }

  if (!allowedOrderStatusTransitions[fromStatus].includes(toStatus)) {
    throw new Error(
      `Transition from ${fromStatus} to ${toStatus} is not allowed`,
    );
  }
}
