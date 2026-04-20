import type { ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";

type ShellProps = {
  children: ReactNode;
};

export function Shell({ children }: ShellProps) {
  return (
    <div className="shell">
      <header className="topbar">
        <Link to="/" className="brand">
          Online Order System
        </Link>
        <nav className="nav">
          <NavLink to="/customer/upload">Customer upload</NavLink>
          <NavLink to="/customer/tracking">Tracking</NavLink>
          <NavLink to="/admin/reviews">Admin reviews</NavLink>
          <NavLink to="/login">Login</NavLink>
        </nav>
      </header>
      <main className="content">{children}</main>
    </div>
  );
}
