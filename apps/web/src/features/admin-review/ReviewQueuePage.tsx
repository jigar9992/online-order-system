import { Link } from "react-router-dom";

const pendingReviews = [
  { id: "sub_001", customer: "customer@example.com", status: "pending" },
  { id: "sub_002", customer: "customer@example.com", status: "pending" },
];

export function ReviewQueuePage() {
  return (
    <section className="card">
      <p className="eyebrow">Admin</p>
      <h1>Review queue</h1>
      <p className="muted">
        This route will later call the backend review endpoints and render file
        previews.
      </p>
      <div className="stack">
        {pendingReviews.map((item) => (
          <article className="preview" key={item.id}>
            <strong>{item.id}</strong>
            <span>{item.customer}</span>
            <span>{item.status}</span>
            <Link to={`/admin/reviews/${item.id}`}>Open detail</Link>
            <div className="row">
              <button type="button">Approve</button>
              <button type="button" className="secondary">
                Reject
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
