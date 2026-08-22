import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AdminPage from './pages/AdminPage.jsx'
import PatientBookingPage from './pages/PatientBookingPage.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/admin" replace />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/p/:token" element={<PatientBookingPage />} />
      </Routes>
    </BrowserRouter>
  )
}
