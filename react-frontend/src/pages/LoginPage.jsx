import { useContext, useState } from "react";
import { Navigate } from "react-router-dom";
import { UserContext } from "../context/UserContext.jsx";

export default function LoginPage() {
  const {
    user,
    loading,
    sessionError,
    login,
  } = useContext(UserContext);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);

    try {
      await login(identifier, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="loading-screen">
        Loading your account...
      </div>
    );
  }

  if (user) {
    return <Navigate to={`/${user.role}`} replace />;
  }

  return (
    <main className="auth-shell">
      <section className="auth-intro">
        <div className="brand">
          CourseHub
          <span>ONLINE COURSE SERVICE</span>
        </div>

        <div>
          <p className="eyebrow">A SPACE TO LEARN</p>

          <h1>Your next course starts here.</h1>

          <p>
            Explore new topics, find your next class,
            and keep your learning in one place.
          </p>
        </div>

        <p className="auth-footnote">
          For students and teachers.
        </p>
      </section>

      <section className="auth-form">
        <p className="eyebrow">WELCOME BACK</p>
        <h2>Sign in to CourseHub</h2>

        <p className="muted">
          Use your student or teacher account.
        </p>

        {(error || sessionError) && (
          <div className="alert error" role="alert">
            {error || sessionError}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label htmlFor="identifier">
            Username or email
          </label>

          <input
            id="identifier"
            autoComplete="username"
            required
            value={identifier}
            onChange={(event) =>
              setIdentifier(event.target.value)
            }
            placeholder="Enter your username or email"
          />

          <label htmlFor="password">Password</label>

          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            placeholder="Enter your password"
          />

          <button
            className="button primary full"
            disabled={busy}
            type="submit"
          >
            {busy ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="small muted">
          Your course access is based on your account role.
        </p>
      </section>
    </main>
  );
}