import { Routes, Route, Navigate } from 'react-router-dom'
import Login from '../pages/Login.jsx'
import Dashboard from '../pages/Dashboard.jsx'
import Users from '../pages/Users.jsx'
import Papers from '../pages/Papers.jsx'
import Questions from '../pages/Questions.jsx'
import Bookmarks from '../pages/Bookmarks.jsx'
import QOTD from '../pages/QOTD.jsx'
import Banners from '../pages/Banners.jsx'
import StructuredAdmin from '../pages/StructuredAdmin.jsx'
import PublicQuestions from '../pages/PublicQuestions.jsx'
import StructuredDetail from '../pages/StructuredDetail.jsx'
import { ProtectedRoute } from '../routes/ProtectedRoute.jsx'
import { AppLayout } from '../shared/AppLayout.jsx'

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/users" element={<Users />} />
        {/* <Route path="/papers" element={<Papers />} /> */}
        <Route path="/questions" element={<Questions />} />
        <Route path="/bookmarks" element={<Bookmarks />} />
        <Route path="/qotd" element={<QOTD />} />
        <Route path="/banners" element={<Banners />} />
        <Route path="/structured-questions" element={<StructuredAdmin />} />
        <Route path="/structured-questions/:year/:part" element={<StructuredDetail />} />
        <Route path="/public-questions" element={<PublicQuestions />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
