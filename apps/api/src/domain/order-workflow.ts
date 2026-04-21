import type {
  FileKind,
  OrderStatus,
  PrescriptionSubmission,
  SubmissionStatus,
  WorkflowHistoryScope,
  WorkflowHistoryStatus,
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

export type SubmissionFileInput = Omit<SubmissionFile, "fileId"> & {
  fileId?: string;
};

export type OrderRecord = {
  id: string;
  customerId: string;
  status: OrderStatus;
  latestSubmissionId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type WorkflowEvent = {
  submissionId: string | null;
  orderId: string;
  scope: WorkflowHistoryScope;
  status: WorkflowHistoryStatus;
  actorId: string;
  reason: string | null;
  createdAt: string;
};

export type WorkflowSnapshot = {
  order: OrderRecord;
  submission: PrescriptionSubmission;
  event: WorkflowEvent;
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

function isSubmissionStatus(value: string): value is SubmissionStatus {
  return ["pending", "approved", "rejected"].includes(value);
}

function isOrderStatus(value: string): value is OrderStatus {
  return ["pending", "approved", "delivered"].includes(value);
}

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
