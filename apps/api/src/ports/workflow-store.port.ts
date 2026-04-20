import type {
  AuthSession,
  FileKind,
  OrderSummary,
  PrescriptionSubmission,
} from "@online-order-system/types";
import type {
  OrderRecord,
  ReviewEvent,
  SubmissionFileInput,
  WorkflowActor,
} from "../domain/order-workflow.js";

export type CreateSubmissionInput = {
  customerId: string;
  file: SubmissionFileInput;
};

export type StoredWorkflowFile = {
  id: string;
  orderId: string;
  customerId: string;
  fileName: string;
  fileKind: FileKind;
  fileSize: number;
};

export type ReviewSubmissionInput = {
  submissionId: string;
  actor: WorkflowActor;
  reason?: string;
};

export interface WorkflowStore {
  seed(): void;
  authenticateUser(
    email: string,
    password: string,
  ): Promise<AuthSession | null>;
  createSubmission(
    input: CreateSubmissionInput,
  ): Promise<PrescriptionSubmission>;
  listPendingSubmissions(): Promise<PrescriptionSubmission[]>;
  getSubmissionById(
    submissionId: string,
  ): Promise<PrescriptionSubmission | null>;
  getOrderById(orderId: string): Promise<OrderRecord | null>;
  getOrderSummary(orderId: string): Promise<OrderSummary | null>;
  getFileById(fileId: string): Promise<StoredWorkflowFile | null>;
  approveSubmission(input: ReviewSubmissionInput): Promise<{
    submission: PrescriptionSubmission;
    order: OrderRecord;
    event: ReviewEvent;
  }>;
  rejectSubmission(input: ReviewSubmissionInput): Promise<{
    submission: PrescriptionSubmission;
    order: OrderRecord;
    event: ReviewEvent;
  }>;
  resubmitOrder(
    input: CreateSubmissionInput & { orderId: string },
  ): Promise<PrescriptionSubmission>;
  markDelivered(orderId: string, actorId: string): Promise<OrderRecord>;
  listFiles(): Promise<
    Array<{
      id: string;
      fileName: string;
      fileKind: FileKind;
      fileSize: number;
    }>
  >;
}
