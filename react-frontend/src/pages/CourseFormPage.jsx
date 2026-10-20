import { useContext, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { UserContext } from "../context/UserContext.jsx";
import useApi from "../hooks/useApi.js";

function CourseForm({ initial, courseId }) {
  const { request } = useContext(UserContext);
  const navigate = useNavigate();
  const [values, setValues] = useState(() => ({
    name: initial?.name || "",
    duration: initial?.duration ?? 1,
    topics: initial?.topics.join(", ") || "",
    price: initial?.price ?? 0,
    maxStudents: initial?.maxStudents ?? 10,
    status: initial?.status || "Open",
  }));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const back = courseId ? `/courses/${courseId}` : "/teacher";

  function change(event) {
    setValues((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    const topics = values.topics.split(/[,\n]/).map((topic) => topic.trim()).filter(Boolean);
    if (!topics.length) { setError("Enter at least one topic."); return; }
    setBusy(true);
    try {
      const result = await request(courseId ? `/api/course/${courseId}` : "/api/course", {
        method: courseId ? "PUT" : "POST",
        body: {
          name: values.name.trim(), duration: Number(values.duration), topics,
          price: Number(values.price), maxStudents: Number(values.maxStudents), status: values.status,
        },
      });
      navigate(`/courses/${result.course.id}`, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Link className="back-link" to={back}>← Back</Link>
      <p className="eyebrow">TEACHER WORKSPACE</p>
      <h1>{courseId ? "Edit course" : "Create a course"}</h1>
      <p className="muted">Set your course details and choose when students can enroll.</p>
      <form className="card course-form" onSubmit={handleSubmit}>
        {error && <div className="alert error" role="alert">{error}</div>}
        <div className="form-grid">
          <div className="wide"><label htmlFor="name">Course name</label>
            <input id="name" name="name" value={values.name} onChange={change} required maxLength={150} placeholder="e.g. Introduction to Web Development" /></div>
          <div><label htmlFor="duration">Duration (days)</label>
            <input id="duration" name="duration" type="number" min="1" step="1" required value={values.duration} onChange={change} /></div>
          <div><label htmlFor="price">Price (THB)</label>
            <input id="price" name="price" type="number" min="0" step="0.01" required value={values.price} onChange={change} /></div>
          <div><label htmlFor="maxStudents">Max Student</label>
            <input id="maxStudents" name="maxStudents" type="number" min={Math.max(1, initial?.enrolledCount || 0)} step="1" required value={values.maxStudents} onChange={change} />
            {!!initial?.enrolledCount && <p className="small muted">At least {initial.enrolledCount} seats are required for enrolled students.</p>}</div>
          <div><label htmlFor="status">Status</label>
            <select id="status" name="status" value={values.status} onChange={change}>
              <option value="Open">Open</option><option value="Close">Close</option><option value="Cancel">Cancel</option>
            </select></div>
          <div className="wide"><label htmlFor="topics">Topics</label>
            <textarea id="topics" name="topics" rows="4" required value={values.topics} onChange={change} placeholder="React, Next.js, MongoDB" />
            <p className="small muted">Separate topics with commas or new lines.</p></div>
        </div>
        <div className="form-actions"><Link className="button secondary" to={back}>Cancel</Link>
          <button className="button primary" type="submit" disabled={busy}>{busy ? "Saving..." : courseId ? "Save changes" : "Create course"}</button></div>
      </form>
    </>
  );
}

export default function CourseFormPage() {
  const { id } = useParams();
  const { data, loading, error, reload } = useApi(id ? `/api/course/${id}` : null);
  if (loading) return <p className="card" role="status">Loading course...</p>;
  if (error) return <><Link className="back-link" to="/teacher">← Back to courses</Link><div className="alert error" role="alert">{error}</div><button className="button secondary" onClick={reload}>Try again</button></>;
  return <CourseForm key={id || "new"} courseId={id} initial={data?.course} />;
}
