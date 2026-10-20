import { useContext, useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { UserContext } from "../context/UserContext.jsx";

export default function Layout() {
  const { user, logout } = useContext(UserContext);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleLogout() {
    setBusy(true);
    setError("");
    try {
      await logout();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <header className="site-header">
        <Link className="brand" to={`/${user.role}`}>CourseHub</Link>
        <nav className="nav-links" aria-label="Main navigation">
          <NavLink to={`/${user.role}`} end>{user.role === "teacher" ? "My courses" : "Explore courses"}</NavLink>
          {user.role === "student" && <NavLink to="/student/my-courses">My learning</NavLink>}
          <NavLink to="/account">My account</NavLink>
          <span className="role-badge">{user.role}</span>
          <button className="button secondary" onClick={handleLogout} disabled={busy}>
            {busy ? "Signing out..." : "Sign out"}
          </button>
        </nav>
      </header>
      <main className="page">
        {error && <div className="alert error" role="alert">{error}</div>}
        <Outlet />
      </main>
    </>
  );
}
