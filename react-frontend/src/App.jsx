import { useContext } from "react";
import { HashRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { UserContext } from "./context/UserContext.jsx";
import Layout from "./components/Layout.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import CoursesPage from "./pages/CoursesPage.jsx";
import CourseDetailPage from "./pages/CourseDetailPage.jsx";
import CourseFormPage from "./pages/CourseFormPage.jsx";

function ProtectedRoute({ role }) {
  const { user, loading } = useContext(UserContext);
  if (loading) return <div className="loading-screen">Loading your account...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={`/${user.role}`} replace />;
  return <Outlet />;
}

function HomeRedirect() {
  const { user } = useContext(UserContext);
  return <Navigate to={`/${user.role}`} replace />;
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<HomeRedirect />} />
            <Route path="/account" element={<DashboardPage />} />
            <Route path="/courses/:id" element={<CourseDetailPage />} />
            <Route element={<ProtectedRoute role="teacher" />}>
              <Route path="/teacher" element={<CoursesPage />} />
              <Route path="/teacher/new" element={<CourseFormPage />} />
              <Route path="/teacher/courses/:id/edit" element={<CourseFormPage />} />
            </Route>
            <Route element={<ProtectedRoute role="student" />}>
              <Route path="/student" element={<CoursesPage key="catalog" />} />
              <Route path="/student/my-courses" element={<CoursesPage key="mine" mine />} />
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
