import React from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { NavBar } from "./components/NavBar";
import LoginPage from "./pages/Login";
import StudentDashboard from "./pages/student/Dashboard";
import StudentMarks from "./pages/student/Marks";
import TeacherSections from "./pages/teacher/Sections";
import HODSectionSummary from "./pages/hod/SectionSummary";
import { ProtectedRoute } from "./components/ProtectedRoute";

const Home: React.FC = () => {
  const { user } = useAuth();
  const nav = useNavigate();
  React.useEffect(() => {
    if (!user) nav("/login", { replace: true });
    else if (user.role === "teacher") nav("/teacher", { replace: true });
    else if (user.role === "student") nav("/student", { replace: true });
    else if (user.role === "hod") nav("/hod", { replace: true });
  }, [nav, user]);
  return null;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <NavBar />
      <div className="max-w-6xl mx-auto p-4">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/student"
            element={
              <ProtectedRoute roles={["student"]}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/section/:id"
            element={
              <ProtectedRoute roles={["student"]}>
                <StudentMarks />
              </ProtectedRoute>
            }
          />

          <Route
            path="/teacher"
            element={
              <ProtectedRoute roles={["teacher"]}>
                <TeacherSections />
              </ProtectedRoute>
            }
          />

          <Route
            path="/hod"
            element={
              <ProtectedRoute roles={["hod"]}>
                <HODSectionSummary />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </AuthProvider>
  );
};
export default App;
