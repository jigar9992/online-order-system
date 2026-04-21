import { useEffect, useState } from "react";
import type {
  AdminSubmissionDetail,
  OrderSummary,
  PrescriptionSubmission,
} from "@online-order-system/types";
import { Link, useParams } from "react-router-dom";
import {
  ApiError,
  apiGet,
  apiPost,
  buildApiUrl,
} from "../../lib/api/client.js";

type DeliverOrderResponse = {
  order: OrderSummary;
};

export function ReviewDetailPage() {
  const params = useParams();
  const submissionId = params.submissionId ?? null;
  const [submission, setSubmission] = useState<PrescriptionSubmission | null>(
    null,
  );
  const [order, setOrder] = useState<OrderSummary | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!submissionId) {
      return;
    }

    let isActive = true;

    async function loadSubmission() {
      setIsLoading(true);
      setErrorMessage(null);
      setActionMessage(null);

      try {
        const response = await apiGet<AdminSubmissionDetail>(
          `/admin/submissions/${submissionId}`,
        );
        if (!isActive) {
          return;
        }

        setSubmission(response.submission);
        setOrder(response.order);
        setRejectionReason(response.submission.rejectionReason ?? "");
      } catch (error) {
        if (!isActive) {
          return;
        }

        if (error instanceof ApiError) {
          setErrorMessage(error.message);
        } else {
          setErrorMessage("Failed to load submission detail.");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadSubmission();

    return () => {
      isActive = false;
    };
  }, [submissionId]);

  const previewUrl = submission
    ? buildApiUrl(`/files/${submission.fileId}`)
    : null;
  const canReview = submission?.status === "pending";
  const canDeliver = order?.status === "approved";

  async function submitDecision(
    path: string,
    successMessage: string,
    body?: { reason: string },
  ) {
    if (!submission) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setActionMessage(null);

    try {
      const response = await apiPost<
        { reason: string } | undefined,
        AdminSubmissionDetail
      >(path, body);
      setSubmission(response.submission);
      setOrder(response.order);
      setRejectionReason(response.submission.rejectionReason ?? "");
      setActionMessage(successMessage);
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Review action failed. Try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function deliverOrder() {
    if (!order) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setActionMessage(null);

    try {
      const response = await apiPost<undefined, DeliverOrderResponse>(
        `/admin/orders/${order.id}/deliver`,
      );
      setOrder(response.order);
      setActionMessage("Order marked as delivered.");
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Delivery update failed. Try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="card">
      <p className="eyebrow">Admin</p>
      <h1>Submission detail</h1>
      <p className="muted">
        Detail view for submission <strong>{submissionId ?? "unknown"}</strong>.
      </p>
      <div className="stack">
        {!submissionId ? (
          <p className="error" role="alert">
            Submission not found.
          </p>
        ) : null}
        {submissionId && errorMessage ? (
          <p className="error" role="alert">
            {errorMessage}
          </p>
        ) : null}
        {actionMessage ? (
          <p className="notice success" role="status">
            {actionMessage}
          </p>
        ) : null}
        {submissionId && isLoading ? (
          <p className="muted">Loading submission detail...</p>
        ) : null}
        {submission ? (
          <>
            <article className="preview">
              <strong>{submission.fileName}</strong>
              <div className="detail-grid">
                <span>Order</span>
                <span>{submission.orderId}</span>
                <span>Order status</span>
                <span>{order?.status ?? "unknown"}</span>
                <span>Latest review outcome</span>
                <span>{order?.latestDecision ?? "No review yet"}</span>
                <span>Customer</span>
                <span>{submission.customerId}</span>
                <span>Status</span>
                <span>{submission.status}</span>
                <span>Submitted</span>
                <span>{new Date(submission.createdAt).toLocaleString()}</span>
              </div>
              {submission.rejectionReason ? (
                <span>
                  Latest rejection reason: {submission.rejectionReason}
                </span>
              ) : null}
              {previewUrl && submission.fileKind === "image" ? (
                <img
                  className="preview-image"
                  src={previewUrl}
                  alt={`Preview of ${submission.fileName}`}
                />
              ) : null}
              {previewUrl ? (
                <a
                  className="preview-link"
                  href={previewUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  {submission.fileKind === "pdf"
                    ? "Open PDF preview"
                    : "Open full preview"}
                </a>
              ) : null}
            </article>
            <label className="field">
              <span>Rejection reason</span>
              <textarea
                rows={4}
                placeholder="Explain what the customer needs to fix."
                value={rejectionReason}
                onChange={(event) => {
                  setRejectionReason(event.target.value);
                }}
                disabled={isSubmitting || !canReview}
              />
            </label>
            <div className="row">
              <button
                type="button"
                disabled={isSubmitting || !canReview}
                onClick={() => {
                  void submitDecision(
                    `/admin/reviews/${submission.id}/approve`,
                    "Submission approved.",
                  );
                }}
              >
                {isSubmitting ? "Saving..." : "Approve"}
              </button>
              <button
                type="button"
                className="secondary"
                disabled={isSubmitting || !canReview}
                onClick={() => {
                  const trimmedReason = rejectionReason.trim();
                  if (!trimmedReason) {
                    setErrorMessage("Rejection reason is required");
                    return;
                  }

                  void submitDecision(
                    `/admin/reviews/${submission.id}/reject`,
                    "Submission rejected.",
                    { reason: trimmedReason },
                  );
                }}
              >
                Reject
              </button>
              {canDeliver ? (
                <button
                  type="button"
                  className="secondary"
                  disabled={isSubmitting}
                  onClick={() => {
                    void deliverOrder();
                  }}
                >
                  Mark delivered
                </button>
              ) : null}
              <Link to="/admin/reviews">Back to queue</Link>
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
