// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import Login from "./pages/Login"
import Signup from "./pages/Signup"
import ResetPassword from "./pages/ResetPassword"
import AdminLayout from "./components/layout/AdminLayout"
import TeamDirectory from "./pages/TeamDirectory"
import ApprovalRules from "./pages/ApprovalRules"
import AllExpenses from "./pages/AllExpenses"
import EmployeeLayout from "./components/layout/EmployeeLayout"
import EmployeeDashboard from "./pages/EmployeeDashboard"
import ManagerLayout from "./components/layout/ManagerLayout"
import ManagerDashboard from "./pages/ManagerDashboard"

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<TeamDirectory />} />
          <Route path="rules" element={<ApprovalRules />} />
          <Route path="expenses" element={<AllExpenses />} />
        </Route>
        <Route path="/employee" element={<EmployeeLayout />}>
          <Route index element={<EmployeeDashboard />} />
        </Route>
        <Route path="/manager" element={<ManagerLayout />}>
          <Route index element={<ManagerDashboard />} />
        </Route>
        {/* If someone types a random URL, send them back to login */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  )
}