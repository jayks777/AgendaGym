import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "../pages/home";
import AlunoDashboard from "../pages/studentDashboard";
import TeacherDashboard from "../pages/teacherDashboard";

export default function AppRoutes() {
  return (
    <Router>
      <Routes>

        <Route path="/" element={<Home />} />
        <Route path="/aluno/dashboard" element={<AlunoDashboard />} />
        <Route path="/professor/dashboard" element={<TeacherDashboard />} />
        
      </Routes>
    </Router>
  );
}