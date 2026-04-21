import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { PrescriptionSubmission } from "@online-order-system/types";
import { useNavigate } from "react-router-dom";
import { ApiError, apiPost } from "../../lib/api/client.js";
import {
  acceptedPrescriptionMimeTypes,
  describePrescriptionFileType,
  formatFileSize,
  maxPrescriptionUploadSizeBytes,
  supportedPrescriptionFormatLabel,
  validatePrescriptionFile,
} from "./upload-constraints.js";
import {
  buildRouteFlashState,
  useRouteFlashMessage,
} from "../shared/route-flash.js";

export function UploadPage() {
  const navigate = useNavigate();
  const { flashMessage, flashOrderId, clearFlashMessage } =
    useRouteFlashMessage();
  const [file, setFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  function handleFileChange(selectedFile: File | null) {
    clearFlashMessage();

    if (!selectedFile) {
      setFile(null);
      setErrorMessage(null);
      return;
    }

    const validationMessage = validatePrescriptionFile(selectedFile);

    if (validationMessage) {
      setFile(null);
      setErrorMessage(validationMessage);
      return;
    }

    setFile(selectedFile);
    setErrorMessage(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearFlashMessage();

    if (!file) {
      setErrorMessage("Select a prescription file before submitting.");
      return;
    }

    const validationMessage = validatePrescriptionFile(file);

    if (validationMessage) {
      setErrorMessage(validationMessage);
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const submission = await apiPost<FormData, PrescriptionSubmission>(
        "/customer/submissions",
        formData,
      );
      setFile(null);
      setErrorMessage(null);
      navigate("/customer/upload", {
        replace: true,
        state: buildRouteFlashState("Prescription uploaded successfully.", {
          orderId: submission.orderId,
        }),
      });
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Upload failed. Try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="card">
      <p className="eyebrow">Customer</p>
      <h1>Upload prescription</h1>
      <p className="muted">
        Supported formats: {supportedPrescriptionFormatLabel}. Maximum file
        size: {formatFileSize(maxPrescriptionUploadSizeBytes)}.
      </p>
      <form className="stack" onSubmit={handleSubmit}>
        {flashMessage ? (
          <div className="notice success" role="status">
            <p>{flashMessage}</p>
            {flashOrderId ? (
              <p>
                Order reference: <code>{flashOrderId}</code>. Keep this for
                tracking.
              </p>
            ) : null}
          </div>
        ) : null}
        <label className="field">
          <span>Select file</span>
          <input
            type="file"
            accept={acceptedPrescriptionMimeTypes.join(",")}
            onChange={(event) => {
              const selectedFile = event.target.files?.[0] ?? null;
              handleFileChange(selectedFile);

              if (!selectedFile || !validatePrescriptionFile(selectedFile)) {
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
            <span>Choose a file to preview it here.</span>
          )}
        </div>
        {errorMessage ? (
          <p className="error" role="alert">
            {errorMessage}
          </p>
        ) : null}
        <button type="submit" disabled={isSubmitting || !file}>
          {isSubmitting ? "Uploading..." : "Submit prescription"}
        </button>
      </form>
    </section>
  );
}
