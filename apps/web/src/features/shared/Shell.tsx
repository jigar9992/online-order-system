import type { ReactNode } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth.js";

type ShellProps = {
  children: ReactNode;
};

export function Shell({ children }: ShellProps) {
  const navigate = useNavigate();
  const { logout, status, user } = useAuth();

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="shell">
      <header className="topbar">
        <Link to="/" className="brand">
          Online Order System
        </Link>
        <nav className="nav">
          {status === "authenticated" && user?.role === "customer" ? (
            <>
              <NavLink to="/customer/upload">Customer upload</NavLink>
              <NavLink to="/customer/tracking">Tracking</NavLink>
            </>
          ) : null}
          {status === "authenticated" && user?.role === "admin" ? (
            <NavLink to="/admin/reviews">Admin reviews</NavLink>
          ) : null}
          {status === "authenticated" && user ? (
            <>
              <span className="session-pill">{user.email}</span>
              <button
                type="button"
                className="nav-button"
                onClick={() => {
                  void handleLogout();
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <NavLink to="/login">Login</NavLink>
          )}
        </nav>
      </header>
      <main className="content">{children}</main>
    </div>
  );
}
