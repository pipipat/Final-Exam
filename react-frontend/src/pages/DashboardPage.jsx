import { useContext } from "react";
import { UserContext } from "../context/UserContext.jsx";

export default function DashboardPage() {
  const { user } = useContext(UserContext);

  return (
    <>
      <p className="eyebrow">YOUR ACCOUNT</p>

      <h1>Welcome, {user.username}</h1>

      <p className="muted">
        {user.role === "teacher"
          ? "Manage your courses and keep track of your students."
          : "Discover courses and keep track of your learning."}
      </p>

      <section className="card account-card">
        <h2>Account details</h2>

        <dl className="account-details">
          <div>
            <dt>Username</dt>
            <dd>{user.username}</dd>
          </div>

          <div>
            <dt>Email</dt>
            <dd>{user.email}</dd>
          </div>

          <div>
            <dt>Role</dt>
            <dd className="capitalize">
              {user.role}
            </dd>
          </div>
        </dl>
      </section>
    </>
  );
}