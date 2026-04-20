export function LoginPage() {
  return (
    <section className="card">
      <p className="eyebrow">Auth</p>
      <h1>Sign in</h1>
      <p className="muted">
        The backend will handle HttpOnly cookie sessions and role-based access.
        This shell keeps the route ready.
      </p>
      <form className="stack" onSubmit={(event) => event.preventDefault()}>
        <label className="field">
          <span>Email</span>
          <input type="email" name="email" placeholder="customer@example.com" />
        </label>
        <label className="field">
          <span>Password</span>
          <input type="password" name="password" placeholder="password" />
        </label>
        <button type="submit">Sign in</button>
      </form>
    </section>
  );
}
