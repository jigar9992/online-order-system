import { Link, useParams } from "react-router-dom";

export function ReviewDetailPage() {
  const params = useParams();

  return (
    <section className="card">
      <p className="eyebrow">Admin</p>
      <h1>Submission detail</h1>
      <p className="muted">
        Detail view for submission{" "}
        <strong>{params.submissionId ?? "unknown"}</strong>.
      </p>
      <div className="stack">
        <article className="preview">
          <strong>Preview placeholder</strong>
          <span>Backend preview URL will be rendered here.</span>
        </article>
        <div className="row">
          <button type="button">Approve</button>
          <button type="button" className="secondary">
            Reject
          </button>
          <Link to="/admin/reviews">Back to queue</Link>
        </div>
      </div>
    </section>
  );
}
