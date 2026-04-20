import { useEffect, useMemo, useState } from "react";
import {
  submissionStatuses,
  supportedPrescriptionMimeTypes,
} from "@online-order-system/types";

export function UploadPage() {
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

  return (
    <section className="card">
      <p className="eyebrow">Customer</p>
      <h1>Upload prescription</h1>
      <p className="muted">
        Supported formats: PNG, JPG, and PDF. Preview happens before submission.
      </p>
      <div className="stack">
        <label className="field">
          <span>Select file</span>
          <input
            type="file"
            accept={supportedPrescriptionMimeTypes.join(",")}
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
        </label>
        {file ? (
          <div className="preview">
            <strong>{file.name}</strong>
            <span>{file.type || "unknown type"}</span>
            <span>{Math.round(file.size / 1024)} KB</span>
            {previewUrl ? <a href={previewUrl}>Open preview</a> : null}
          </div>
        ) : (
          <div className="preview empty">Choose a file to preview it here.</div>
        )}
        <button type="button">Submit prescription</button>
        <p className="muted">
          Initial status values follow: {submissionStatuses.join(", ")}.
        </p>
      </div>
    </section>
  );
}
