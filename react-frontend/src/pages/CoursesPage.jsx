import { useContext, useState } from "react";
import { Link } from "react-router-dom";
import { UserContext } from "../context/UserContext.jsx";
import useApi from "../hooks/useApi.js";

export default function CoursesPage({ mine = false }) {
  const { user } = useContext(UserContext);
  const teacher = user.role === "teacher";
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const query = new URLSearchParams();
  if (mine) query.set("mine", "true");
  if (search) query.set("search", search);
  const path = `/api/course${query.size ? `?${query}` : ""}`;
  const { data, loading, error, reload } = useApi(path);
  const courses = data?.courses || [];

  function handleSearch(event) {
    event.preventDefault();
    setSearch(draft.trim());
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">{teacher ? "TEACHER WORKSPACE" : "YOUR LEARNING JOURNEY"}</p>
          <h1>{teacher ? "My courses" : mine ? "My learning" : "Explore courses"}</h1>
          <p className="muted">{teacher
            ? "Create courses, manage availability, and view your students."
            : mine ? "The courses you have enrolled in, all in one place."
              : "Find a topic you love and take the next step."}</p>
        </div>
        {teacher && <Link className="button primary" to="/teacher/new">+ Create course</Link>}
      </div>

      <form className="search-bar" onSubmit={handleSearch}>
        <label className="sr-only" htmlFor="course-search">Search courses</label>
        <input id="course-search" value={draft} onChange={(e) => setDraft(e.target.value)}
          placeholder="Search by course or teacher name" maxLength={150} />
        <button className="button primary" type="submit">Search</button>
        {search && <button className="button secondary" type="button"
          onClick={() => { setDraft(""); setSearch(""); }}>Clear</button>}
      </form>

      {loading && <p className="card" role="status">Loading courses...</p>}
      {error && <div className="alert error" role="alert">{error} <button className="text-button" onClick={reload}>Try again</button></div>}
      {!loading && !error && (
        <>
          <div className="stats-grid">
            <div className="stat"><span>{teacher ? "Your courses" : "Courses found"}</span><strong>{courses.length}</strong></div>
            <div className="stat"><span>Open courses</span><strong>{courses.filter((course) => course.status === "Open").length}</strong></div>
            <div className="stat"><span>{teacher ? "Total enrollments" : "Enrolled courses"}</span><strong>{teacher
              ? courses.reduce((sum, course) => sum + course.enrolledCount, 0)
              : courses.filter((course) => course.isEnrolled).length}</strong></div>
          </div>
          {courses.length === 0 ? (
            <div className="card empty-state"><h2>No courses found</h2><p className="muted">{search
              ? "Try a different course or teacher name."
              : teacher ? "Create your first course to get started."
                : mine ? "Explore the course catalog to find your next class." : "Check back soon for new courses."}</p>
              {mine && <Link className="button primary" to="/student">Explore courses</Link>}
            </div>
          ) : (
            <div className="course-grid">
              {courses.map((course) => (
                <article className="card course-card" key={course.id}>
                  <div className="card-top"><span className={`status status-${course.status.toLowerCase()}`}>{course.status}</span>
                    {course.isEnrolled && <span className="enrolled-tag">Enrolled</span>}</div>
                  <h2><Link to={`/courses/${course.id}`}>{course.name}</Link></h2>
                  <p className="muted small">By {course.teacherName} · {course.duration} days</p>
                  <div className="topics">{course.topics.slice(0, 3).map((topic) => <span key={topic}>{topic}</span>)}</div>
                  <p className="small muted">{course.enrolledCount} / {course.maxStudents} students · {course.availableSeats} seats left</p>
                  <div className="card-bottom"><strong className="price">฿{course.price.toLocaleString()}</strong>
                    <Link className="button secondary" to={`/courses/${course.id}`}>View details</Link></div>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
