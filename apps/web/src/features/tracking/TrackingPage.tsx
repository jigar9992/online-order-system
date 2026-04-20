import { useEffect, useMemo, useState, type FormEvent } from "react";
import type {
  OrderSummary,
  PrescriptionSubmission,
} from "@online-order-system/types";
import { ApiError, apiGet, apiPost } from "../../lib/api/client.js";
import {
  acceptedPrescriptionMimeTypes,
  describePrescriptionFileType,
  formatFileSize,
  maxPrescriptionUploadSizeBytes,
  supportedPrescriptionFormatLabel,
  validatePrescriptionFile,
} from "../customer-upload/upload-constraints.js";

function formatTimestamp(timestamp: string): string {
  const parsedDate = new Date(timestamp);

  if (Number.isNaN(parsedDate.getTime())) {
    return timestamp;
  }

  return parsedDate.toLocaleString();
}

export function TrackingPage() {
  const [orderId, setOrderId] = useState("");
  const [summary, setSummary] = useState<OrderSummary | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [resubmitError, setResubmitError] = useState<string | null>(null);
  const [resubmitSuccess, setResubmitSuccess] =
    useState<PrescriptionSubmission | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isResubmitting, setIsResubmitting] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const previewUrl = useMemo(
    () => (file ? URL.createObjectURL(file) : null),
    [file],
  );

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const latestEvent = summary?.history.at(-1) ?? null;
  const latestRejectionReason =
    summary?.latestDecision === "rejected"
      ? (latestEvent?.reason ?? null)
      : null;

  async function loadTracking(targetOrderId: string) {
    setIsLoading(true);
    setLoadError(null);

    try {
      const response = await apiGet<OrderSummary>(
        `/customer/orders/${targetOrderId}`,
      );
      setSummary(response);
      setOrderId(response.id);
    } catch (error) {
      setSummary(null);
      if (error instanceof ApiError) {
        setLoadError(error.message);
      } else {
        setLoadError("Failed to load order tracking.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  function handleFileChange(selectedFile: File | null) {
    setResubmitSuccess(null);

    if (!selectedFile) {
      setFile(null);
      setResubmitError(null);
      return;
    }

    const validationMessage = validatePrescriptionFile(selectedFile);

    if (validationMessage) {
      setFile(null);
      setResubmitError(validationMessage);
      return;
    }

    setFile(selectedFile);
    setResubmitError(null);
  }

  async function handleTrackingSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedOrderId = orderId.trim();
    if (!trimmedOrderId) {
      setLoadError("Enter an order reference to load tracking.");
      return;
    }

    void loadTracking(trimmedOrderId);
  }

  async function handleResubmission(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResubmitSuccess(null);

    if (!summary) {
      setResubmitError("Load an order before resubmitting.");
      return;
    }

    if (!file) {
      setResubmitError("Select a replacement prescription file.");
      return;
    }

    const validationMessage = validatePrescriptionFile(file);
    if (validationMessage) {
      setResubmitError(validationMessage);
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setIsResubmitting(true);
    setResubmitError(null);

    try {
      const submission = await apiPost<FormData, PrescriptionSubmission>(
        `/customer/orders/${summary.id}/resubmit`,
        formData,
      );
      setResubmitSuccess(submission);
      setFile(null);
      await loadTracking(summary.id);
    } catch (error) {
      if (error instanceof ApiError) {
        setResubmitError(error.message);
      } else {
        setResubmitError("Resubmission failed. Try again.");
      }
    } finally {
      setIsResubmitting(false);
    }
  }

  return (
    <section className="card">
      <p className="eyebrow">Customer</p>
      <h1>Track order</h1>
      <p className="muted">
        Load an order by reference to see its current state, latest review, and
        workflow history.
      </p>
      <div className="stack">
        <form className="stack" onSubmit={handleTrackingSubmit}>
          <label className="field">
            <span>Order reference</span>
            <input
              type="text"
              placeholder="order_123"
              value={orderId}
              onChange={(event) => {
                setOrderId(event.target.value);
              }}
            />
          </label>
          {loadError ? (
            <p className="error" role="alert">
              {loadError}
            </p>
          ) : null}
          <button type="submit" disabled={isLoading}>
            {isLoading ? "Loading..." : "Load tracking"}
          </button>
        </form>
        {summary ? (
          <>
            {resubmitSuccess ? (
              <p className="notice success" role="status">
                Replacement uploaded. New submission {resubmitSuccess.id} is now
                pending review.
              </p>
            ) : null}
            <article className="preview">
              <strong>Order {summary.id}</strong>
              <div className="detail-grid">
                <span>Order status</span>
                <span>{summary.status}</span>
                <span>Latest review outcome</span>
                <span>{summary.latestDecision ?? "No review yet"}</span>
              </div>
              {latestRejectionReason ? (
                <span>Latest rejection reason: {latestRejectionReason}</span>
              ) : null}
            </article>
            <article className="preview">
              <strong>Workflow history</strong>
              {summary.history.length === 0 ? (
                <span>No workflow events recorded yet.</span>
              ) : (
                <ol className="history-list">
                  {summary.history.map((event, index) => (
                    <li
                      key={`${event.submissionId}-${event.createdAt}-${index}`}
                    >
                      <strong>{event.status}</strong>
                      <span>Submission {event.submissionId}</span>
                      <span>{formatTimestamp(event.createdAt)}</span>
                      {event.reason ? (
                        <span>Reason: {event.reason}</span>
                      ) : null}
                    </li>
                  ))}
                </ol>
              )}
            </article>
            {summary.latestDecision === "rejected" ? (
              <form className="stack" onSubmit={handleResubmission}>
                <p className="eyebrow">Resubmit</p>
                <p className="muted">
                  Upload a replacement prescription to reopen review on the same
                  order.
                </p>
                <label className="field">
                  <span>Select replacement file</span>
                  <input
                    type="file"
                    accept={acceptedPrescriptionMimeTypes.join(",")}
                    onChange={(event) => {
                      const selectedFile = event.target.files?.[0] ?? null;
                      handleFileChange(selectedFile);

                      if (
                        !selectedFile ||
                        !validatePrescriptionFile(selectedFile)
                      ) {
                        return;
                      }

                      event.target.value = "";
                    }}
                  />
                </label>
                <div className={`preview ${file ? "" : "empty"}`.trim()}>
                  {file ? (
                    <>
                      <strong>{file.name}</strong>
                      <div className="preview-meta">
                        <span>{describePrescriptionFileType(file.type)}</span>
                        <span>{formatFileSize(file.size)}</span>
                      </div>
                      {previewUrl && file.type.startsWith("image/") ? (
                        <img
                          className="preview-image"
                          src={previewUrl}
                          alt={`Preview of ${file.name}`}
                        />
                      ) : null}
                      {previewUrl ? (
                        <a
                          className="preview-link"
                          href={previewUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {file.type === "application/pdf"
                            ? "Open PDF preview"
                            : "Open full preview"}
                        </a>
                      ) : null}
                    </>
                  ) : (
                    <span>
                      Supported formats: {supportedPrescriptionFormatLabel}.
                      Maximum size:{" "}
                      {formatFileSize(maxPrescriptionUploadSizeBytes)}.
                    </span>
                  )}
                </div>
                {resubmitError ? (
                  <p className="error" role="alert">
                    {resubmitError}
                  </p>
                ) : null}
                <button type="submit" disabled={isResubmitting || !file}>
                  {isResubmitting ? "Uploading..." : "Submit replacement"}
                </button>
              </form>
            ) : null}
          </>
        ) : null}
      </div>
    </section>
  );
}
