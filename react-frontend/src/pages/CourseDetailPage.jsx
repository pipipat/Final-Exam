import { useContext, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { UserContext } from "../context/UserContext.jsx";
import useApi from "../hooks/useApi.js";

export default function CourseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, request } = useContext(UserContext);
  const { data, loading, error, reload } = useApi(`/api/course/${id}`);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [message, setMessage] = useState("");
  const teacher = user.role === "teacher";
  const back = teacher ? "/teacher" : "/student";

  async function handleEnroll() {
    setBusy(true);
    setActionError("");
    setMessage("");
    try {
      const result = await request(`/api/course/${id}/enroll`, { method: "POST" });
      setMessage(result.message);
      reload();
    } catch (err) {
      setActionError(err.message);
      if ([404, 409].includes(err.status)) reload();
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm("Delete this course? This action cannot be undone.")) return;
    setBusy(true);
    setActionError("");
    try {
      await request(`/api/course/${id}`, { method: "DELETE" });
      navigate("/teacher", { replace: true });
    } catch (err) {
      setActionError(err.message);
      if (err.status === 409) reload();
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="card" role="status">Loading course...</p>;
  if (error) return <><Link className="back-link" to={back}>← Back to courses</Link><div className="alert error" role="alert">{error}</div><button className="button secondary" onClick={reload}>Try again</button></>;
  const course = data.course;

  return (
    <>
      <Link className="back-link" to={back}>← Back to courses</Link>
      <div className="page-heading"><div>
        <span className={`status status-${course.status.toLowerCase()}`}>{course.status}</span>
        <h1 className="detail-title">{course.name}</h1>
        <p className="muted">Taught by {course.teacherName}</p>
      </div></div>
      {actionError && <div className="alert error" role="alert">{actionError}</div>}
      {message && <div className="alert success" role="status">{message}</div>}

      <div className="detail-grid">
        <section className="card"><h2>About this course</h2>
          <dl className="account-details">
            <div><dt>Duration</dt><dd>{course.duration} days</dd></div>
            <div><dt>Teacher</dt><dd>{course.teacherName}</dd></div>
            <div><dt>Students</dt><dd>{course.enrolledCount} / {course.maxStudents}</dd></div>
          </dl>
          <h2 className="section-title">Topics you will learn</h2>
          <div className="topics">{course.topics.map((topic) => <span key={topic}>{topic}</span>)}</div>
        </section>

        <aside className="card enrollment-card">
          <p className="muted small">COURSE PRICE</p><p className="detail-price">฿{course.price.toLocaleString()}</p>
          <p className="muted">{course.availableSeats} of {course.maxStudents} seats available</p>
          {teacher ? <div className="stack">
            <Link className="button primary full" to={`/teacher/courses/${id}/edit`}>Edit course</Link>
            <button className="button danger full" onClick={handleDelete} disabled={busy || course.enrolledCount > 0}>
              {busy ? "Deleting..." : "Delete course"}</button>
            {course.enrolledCount > 0 && <p className="small muted">Courses with enrolled students cannot be deleted.</p>}
          </div> : course.isEnrolled ? <div className="alert success">You are enrolled in this course.</div>
            : <button className="button primary full" onClick={handleEnroll}
              disabled={busy || course.status !== "Open" || course.availableSeats === 0}>
              {busy ? "Enrolling..." : course.status !== "Open" ? "Enrollment closed"
                : course.availableSeats === 0 ? "Course full" : "Enroll in this course"}
            </button>}
        </aside>
      </div>

      {teacher && <section className="card students-section"><h2>Enrolled students ({course.enrolledCount})</h2>
        {course.enrolledStudents?.length ? <div className="table-wrap"><table>
          <thead><tr><th>Username</th><th>Email</th></tr></thead>
          <tbody>{course.enrolledStudents.map((student) => <tr key={student.id}><td>{student.username}</td><td>{student.email}</td></tr>)}</tbody>
        </table></div> : <p className="muted">No students have enrolled yet.</p>}
      </section>}
    </>
  );
}
