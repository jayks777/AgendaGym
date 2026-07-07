import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "../pages/home";
import AlunoDashboard from "../pages/studentDashboard";

export default function AppRoutes() {
  return (
    <Router>
      <Routes>

        <Route path="/" element={<Home />} />
        <Route path="/aluno/dashboard" element={<AlunoDashboard />} />
        
      </Routes>
    </Router>
  );
}