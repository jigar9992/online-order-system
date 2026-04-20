import { useEffect, useState } from "react";
import type { PrescriptionSubmission } from "@online-order-system/types";
import { Link } from "react-router-dom";
import { ApiError, apiGet } from "../../lib/api/client.js";

export function ReviewQueuePage() {
  const [filterValue, setFilterValue] = useState("");
  const [pendingReviews, setPendingReviews] = useState<
    PrescriptionSubmission[]
  >([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    async function loadPendingReviews() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const submissions = await apiGet<PrescriptionSubmission[]>(
          "/admin/reviews?status=pending",
        );
        if (!isActive) {
          return;
        }

        setPendingReviews(submissions);
      } catch (error) {
        if (!isActive) {
          return;
        }

        if (error instanceof ApiError) {
          setErrorMessage(error.message);
        } else {
          setErrorMessage("Failed to load the review queue.");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadPendingReviews();

    return () => {
      isActive = false;
    };
  }, []);

  const normalizedFilter = filterValue.trim().toLowerCase();
  const filteredReviews = pendingReviews.filter((item) => {
    if (!normalizedFilter) {
      return true;
    }

    return [
      item.id,
      item.orderId,
      item.customerId,
      item.fileName,
      item.status,
    ].some((value) => value.toLowerCase().includes(normalizedFilter));
  });

  return (
    <section className="card">
      <p className="eyebrow">Admin</p>
      <h1>Review queue</h1>
      <p className="muted">
        Review pending submissions, filter the queue, and open a submission for
        decisioning.
      </p>
      <div className="stack">
        <label className="field">
          <span>Filter queue</span>
          <input
            type="text"
            placeholder="Search by submission, order, customer, or file"
            value={filterValue}
            onChange={(event) => {
              setFilterValue(event.target.value);
            }}
          />
        </label>
        {errorMessage ? (
          <p className="error" role="alert">
            {errorMessage}
          </p>
        ) : null}
        {isLoading ? <p className="muted">Loading pending reviews...</p> : null}
        {!isLoading && !errorMessage && filteredReviews.length === 0 ? (
          <article className="preview empty-state">
            <strong>No pending reviews match the current filter.</strong>
            <span>
              New submissions will appear here when they are awaiting review.
            </span>
          </article>
        ) : null}
        {filteredReviews.map((item) => (
          <article className="preview" key={item.id}>
            <strong>{item.id}</strong>
            <div className="detail-grid">
              <span>Order</span>
              <span>{item.orderId}</span>
              <span>Customer</span>
              <span>{item.customerId}</span>
              <span>File</span>
              <span>{item.fileName}</span>
              <span>Status</span>
              <span>{item.status}</span>
            </div>
            <div className="row">
              <Link to={`/admin/reviews/${item.id}`}>Open detail</Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
