import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import Links from './pages/Links'
import Profile from './pages/Profile'
import PublicProfile from './pages/PublicProfile'
import Dashboard from './pages/Dashboard'
import LinksPage from './pages/LinksPage'
import AppearancePage from './pages/AppearancePage'
import Login from './pages/Login'
import Register from './pages/Register'
import NavBar from './components/NavBar'

function Protected({ children }) {
  const authed = typeof window !== 'undefined' && localStorage.getItem('auth')
  return authed ? children : <Navigate to="/login" replace />
}

export default function App() {
  const [authed, setAuthed] = useState(!!localStorage.getItem('auth'))
  const location = useLocation();
  const isDashboard = location.pathname.startsWith('/dashboard') || location.pathname === '/profile';
  const isPublicProfile = location.pathname.startsWith('/u/');

  useEffect(() => {
    const checkAuth = () => setAuthed(!!localStorage.getItem('auth'))
    window.addEventListener('auth-change', checkAuth)
    return () => window.removeEventListener('auth-change', checkAuth)
  }, [])

  // Need to force re-render on route change to update isDashboard check if simplistic
  // Ideally use useLocation() but for now this works with window.location if we rely on full re-renders or checks

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Hide NavBar on Dashboard and Public Profile */}
      {!isDashboard && !isPublicProfile && <NavBar />}

      <main className={isDashboard ? "h-screen overflow-hidden" : "container mx-auto p-4 flex-grow"}>
        <Routes>
          {/* Root Path */}
          <Route path="/" element={authed ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />

          {/* Legacy Routes - keeping for now */}
          <Route path="/links" element={<Protected><Links /></Protected>} />
          <Route path="/profile" element={<Protected><Profile /></Protected>} />

          {/* New Dashboard Routes */}
          <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
          <Route path="/dashboard/:profileId/links" element={<Protected><LinksPage /></Protected>} />
          <Route path="/dashboard/:profileId/appearance" element={<Protected><AppearancePage /></Protected>} />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/u/:username" element={<PublicProfile />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}
