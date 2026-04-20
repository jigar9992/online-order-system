import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { ApiError } from "../../lib/api/client.js";
import { getRoleHomePath } from "./role-home.js";
import { useAuth } from "./useAuth.js";

export function LoginPage() {
  const navigate = useNavigate();
  const { login, status, user } = useAuth();
  const [email, setEmail] = useState("customer@example.com");
  const [password, setPassword] = useState("password");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (status === "authenticated" && user) {
    return <Navigate replace to={getRoleHomePath(user.role)} />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const session = await login({ email, password });
      navigate(getRoleHomePath(session.role), { replace: true });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setErrorMessage("Invalid email or password.");
      } else {
        setErrorMessage("Sign in failed. Try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="card">
      <p className="eyebrow">Auth</p>
      <h1>Sign in</h1>
      <p className="muted">
        Sessions are stored in HttpOnly cookies and access is restricted by
        role.
      </p>
      <form className="stack" onSubmit={handleSubmit}>
        <label className="field">
          <span>Email</span>
          <input
            type="email"
            name="email"
            value={email}
            placeholder="customer@example.com"
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label className="field">
          <span>Password</span>
          <input
            type="password"
            name="password"
            value={password}
            placeholder="password"
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        {errorMessage ? <p className="error">{errorMessage}</p> : null}
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </section>
  );
}
