export function TrackingPage() {
  return (
    <section className="card">
      <p className="eyebrow">Customer</p>
      <h1>Track order</h1>
      <p className="muted">
        Tracking will show the current order state, latest review, and the
        workflow history.
      </p>
      <div className="stack">
        <label className="field">
          <span>Order reference</span>
          <input type="text" placeholder="order_123" />
        </label>
        <button type="button">Load tracking</button>
        <article className="preview">
          <strong>Status</strong>
          <span>pending</span>
          <span>Latest review outcome will appear here.</span>
        </article>
      </div>
    </section>
  );
}
